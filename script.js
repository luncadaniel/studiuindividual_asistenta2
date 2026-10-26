
const $ = (id) => document.getElementById(id);

let albums = JSON.parse(localStorage.getItem("photoAlbums") || "[]");
let photos = JSON.parse(localStorage.getItem("photoItems") || "[]");
let activeAlbum = null;

function saveData() {
    localStorage.setItem("photoAlbums", JSON.stringify(albums));
    localStorage.setItem("photoItems", JSON.stringify(photos));
}

function renderAlbums() {
    $("albumList").innerHTML = "";
    $("albumSelect").innerHTML = "";

    albums.forEach(album => {
        const option = document.createElement("option");
        option.value = album.id;
        option.textContent = album.name;
        $("albumSelect").appendChild(option);

        const card = document.createElement("div");
        card.className = "album-card";

        const title = document.createElement("h3");
        title.textContent = album.name;

        const description = document.createElement("p");
        description.textContent = album.description || "Fără descriere";

        const count = document.createElement("p");
        count.textContent =
            photos.filter(photo => photo.albumId === album.id).length
            + " fotografii";

        const viewButton = document.createElement("button");
        viewButton.textContent = "Deschide";
        viewButton.onclick = () => {
            activeAlbum = album.id;
            renderPhotos();
        };

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Șterge albumul";
        deleteButton.onclick = () => {
            if (!confirm("Ștergi albumul și fotografiile sale?")) return;

            photos = photos.filter(photo => photo.albumId !== album.id);
            albums = albums.filter(item => item.id !== album.id);

            if (activeAlbum === album.id) activeAlbum = null;

            saveData();
            renderAlbums();
            renderPhotos();
        };

        card.append(title, description, count, viewButton, deleteButton);
        $("albumList").appendChild(card);
    });

    const hasAlbums = albums.length > 0;
    $("albumSelect").disabled = !hasAlbums;
    $("addPhotos").disabled = !hasAlbums;
}

function renderPhotos() {
    $("gallery").innerHTML = "";

    const visiblePhotos = activeAlbum
        ? photos.filter(photo => photo.albumId === activeAlbum)
        : photos;

    if (visiblePhotos.length === 0) {
        $("gallery").innerHTML =
            '<p class="empty">Nu există fotografii. Creează un album și adaugă imagini!</p>';
        return;
    }

    visiblePhotos.forEach(photo => {
        const card = document.createElement("article");
        card.className = "photo-card";

        const img = document.createElement("img");
        img.src = photo.data;
        img.alt = photo.name;
        img.loading = "lazy";

        const info = document.createElement("div");
        info.className = "photo-info";

        const name = document.createElement("p");
        name.textContent = photo.name;

        const album = albums.find(item => item.id === photo.albumId);
        const albumName = document.createElement("small");
        albumName.textContent = album ? album.name : "";

        const remove = document.createElement("button");
        remove.textContent = "Șterge fotografia";
        remove.onclick = () => {
            photos = photos.filter(item => item.id !== photo.id);
            saveData();
            renderAlbums();
            renderPhotos();
        };

        info.append(name, albumName, document.createElement("br"), remove);
        card.append(img, info);
        $("gallery").appendChild(card);
    });
}

$("albumForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("albumName").value.trim();
    if (!name) return;

    const album = {
        id: crypto.randomUUID(),
        name,
        description: $("albumDescription").value.trim()
    };

    albums.push(album);
    activeAlbum = album.id;

    saveData();
    $("albumForm").reset();
    renderAlbums();
    renderPhotos();
});

$("addPhotos").addEventListener("click", async () => {
    const files = Array.from($("photoInput").files);
    const albumId = $("albumSelect").value;

    if (!albumId || files.length === 0) {
        alert("Alege un album și cel puțin o fotografie.");
        return;
    }

    const imageFiles = files.filter(file => file.type.startsWith("image/"));

    if (imageFiles.length !== files.length) {
        alert("Unele fișiere nu sunt imagini și vor fi ignorate.");
    }

    for (const file of imageFiles) {
        const data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        }).catch(() => null);

        if (data) {
            photos.push({
                id: crypto.randomUUID(),
                albumId,
                name: file.name,
                data
            });
        }
    }

    try {
        saveData();
        activeAlbum = albumId;
        $("photoInput").value = "";
        renderAlbums();
        renderPhotos();
    } catch (error) {
        alert("Spațiul browserului poate fi insuficient. Încearcă imagini mai mici.");
    }
});

$("showAll").addEventListener("click", () => {
    activeAlbum = null;
    renderPhotos();
});

renderAlbums();
renderPhotos();
