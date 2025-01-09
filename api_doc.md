Endpoint
# Hacktiv Group Project API Documentation

1. GET / 
- Deskripsi: Mengembalikan pesan selamat datang.
- Respons: json
```json
{
  "message": "Welcome to What The Chess API!"
}
```
## Event WebSocket
Berikut adalah event yang ditangani melalui WebSocket. Klien harus menggunakan koneksi WebSocket untuk berinteraksi dengan API ini.

1. connection
- Deskripsi: Ketika klien terhubung ke server, event connection akan dipicu. Setiap klien yang terhubung akan diberikan ID socket yang unik.
- Penggunaan: Event ini akan dipicu secara otomatis saat klien terhubung.
2. username
- Deskripsi: Menetapkan nama pengguna untuk pemain.
- Payload Event:
  - username (string): Nama pengguna pemain.
Contoh:
```json
socket.emit("username", "player1");
```
3. createRoom
- Deskripsi: Membuat ruangan catur baru. Server akan menghasilkan ID ruangan unik dan mengirimkannya kembali ke klien.
- Payload Event: Tidak ada.
- Payload Respons:
  - roomId (string): ID unik dari ruangan yang dibuat.
Contoh:
```js
socket.emit("createRoom", (roomId) => {
  console.log("Ruangan dibuat dengan ID:", roomId);
});
```
4. joinRoom
- Deskripsi: Memungkinkan pemain untuk bergabung dengan ruangan yang sudah ada dengan memberikan ID ruangan.
- Payload Event:
  - roomId (string): ID ruangan yang ingin dimasuki.
- Payload Respons:
  - error (boolean): Menunjukkan apakah terjadi kesalahan.
  - message (string): Pesan yang menjelaskan kesalahan, jika ada.
  - players (array): Daftar pemain yang ada di dalam ruangan, masing-masing memiliki id dan username.

Contoh:
```js
socket.emit("joinRoom", { roomId: "some-room-id" }, (response) => {
  if (response.error) {
    console.log(response.message);
  } else {
    console.log("Ruangan berhasil dimasuki", response.players);
  }
});
```
5. move
- Deskripsi: Mengirim gerakan catur ke lawan dalam ruangan.
- Payload Event:
  - room (string): ID ruangan tempat gerakan akan dikirim.
  - move (string): Gerakan catur dalam notasi aljabar standar (misalnya, e2e4).

Contoh:
```js
socket.emit("move", { room: "room-id", move: "e2e4" });
```
6. playerDisconnected
- Deskripsi: Dikirim saat seorang pemain terputus dari ruangan.
- Payload Respons:
  - players (array): Daftar pemain yang masih ada di dalam ruangan.
- Contoh: Server akan mengirimkan event ini secara otomatis saat seorang pemain terputus.

7. closeRoom
- Deskripsi: Menutup sebuah ruangan dan memutuskan semua pemain yang ada di dalamnya.
- Payload Event:
  - roomId (string): ID ruangan yang ingin ditutup.

Contoh:
```js
socket.emit("closeRoom", { roomId: "room-id" });
```

8. opponentJoined
- Deskripsi: Dikirimkan kepada pemain saat lawan bergabung ke dalam ruangan.
- Payload Respons:
  - players (array): Daftar pemain yang ada di dalam ruangan.
- Contoh: Server akan mengirimkan event ini secara otomatis saat lawan bergabung ke dalam ruangan.

9. closeRoom
- Deskripsi: Memberitahukan klien bahwa ruangan sedang ditutup.
- Payload Respons:
  - roomId (string): ID dari ruangan yang sedang ditutup.
- Contoh: Server akan mengirimkan event ini saat ruangan ditutup.

10. disconnect
- Deskripsi: Dikirimkan saat klien terputus dari server.
- Contoh: Event ini akan dipicu secara otomatis saat klien terputus.

## Penanganan Error
- Jika ruangan yang ingin dimasuki tidak ada, pesan kesalahan akan dikembalikan:

```js
{
  "error": true,
  "message": "Room does not exist"
}
```

- Jika nama pengguna sudah digunakan dalam ruangan tersebut, pesan kesalahan akan dikembalikan:

```js
{
  "error": true,
  "message": "Username already in use in this room"
}
```

## Alur Contoh
1. Membuat Ruangan:

```js
socket.emit("createRoom", (roomId) => {
  console.log("Ruangan dibuat dengan ID:", roomId);
});
```
2. Bergabung ke Ruangan:

```js
socket.emit("joinRoom", { roomId: "some-room-id" }, (response) => {
  if (response.error) {
    console.log(response.message);
  } else {
    console.log("Ruangan berhasil dimasuki", response.players);
  }
});
```

3. Melakukan Gerakan:

```js
socket.emit("move", { room: "room-id", move: "e2e4" });
```

4. Menutup Ruangan:

```js
socket.emit("closeRoom", { roomId: "room-id" });
```

Kesimpulan
API ini memungkinkan pengguna untuk membuat, bergabung, dan berinteraksi dalam ruangan catur real-time. Server menangani aksi pemain seperti melakukan gerakan dan mengelola ruangan, memberikan pengalaman bermain multiplayer yang lancar.
