# 📚 Dokumentasi API PackLoop (Backend Core)

Selamat datang di dokumentasi resmi **API PackLoop Backend**. Dokumen ini disusun secara sederhana dan jelas agar mudah dipahami oleh pengembang Mobile Client (Flutter / React Native) maupun IoT Station.

---

## 📌 Informasi Dasar & Cara Pakai

* **Base URL**: `http://localhost:5000`
* **Format Data**: JSON (`Content-Type: application/json`)
* **Autentikasi**:
  * Endpoint bersimbol 🔓 **Public** : Bisa diakses langsung tanpa token.
  * Endpoint bersimbol 🔒 **Protected** : Membutuhkan Header Autentikasi JWT Supabase:
    ```http
    Authorization: Bearer <TOKEN_JWT_SUPABASE>
    ```

---

## 📊 Daftar Ringkasan 18 Endpoint API

| Method | Endpoint Path | Akses | Fungsi Singkat |
| :--- | :--- | :---: | :--- |
| `GET` | `/` | 🔓 Public | Health Check server backend |
| `POST` | `/api/auth/verify-token` | 🔓 Public | Verifikasi token login dari Supabase |
| `GET` | `/api/auth/me` | 🔒 Protected | Cek data sesi user yang sedang login |
| `GET` | `/api/users/profile` | 🔒 Protected | Ambil profil & statistik dasbor (poin, kg, karbon) |
| `PUT` | `/api/users/profile` | 🔒 Protected | Update nama, no. telp, atau foto profil |
| `DELETE` | `/api/users/profile` | 🔒 Protected | Hapus akun & seluruh data user secara permanen |
| `GET` | `/api/stations` | 🔓 Public | Ambil seluruh daftar lokasi stasiun & kompartemen |
| `GET` | `/api/stations/:id` | 🔓 Public | Ambil detail 1 stasiun spesifik |
| `GET` | `/api/stations/:id/compartments` | 🔓 Public | Cek kapasitas kompartemen real-time stasiun |
| `POST` | `/api/deposits` | 🔒 Protected | Catat setoran kemasan baru (Scan QR / Machine Drop) |
| `GET` | `/api/deposits` | 🔒 Protected | Ambil daftar riwayat setoran user |
| `GET` | `/api/deposits/:id` | 🔒 Protected | Ambil detail setoran & timeline tracking daur ulang |
| `DELETE` | `/api/deposits/:id` | 🔒 Protected | Batalkan / hapus transaksi setoran |
| `GET` | `/api/rewards/rules` | 🔓 Public | Ambil aturan perhitungan poin & karbon per kemasan |
| `POST` | `/api/rewards/redeem` | 🔒 Protected | Tukar poin ke e-wallet (GoPay, OVO, DANA, LinkAja) |
| `GET` | `/api/rewards/history` | 🔒 Protected | Ambil riwayat penukaran poin user |
| `DELETE` | `/api/rewards/history/:id` | 🔒 Protected | Batalkan permintaan penukaran poin (status PENDING) |
| `GET` | `/api/notifications` | 🔒 Protected | Ambil daftar notifikasi user |
| `PUT` | `/api/notifications/:id/read` | 🔒 Protected | Tandai 1 notifikasi telah dibaca |
| `DELETE` | `/api/notifications/:id` | 🔒 Protected | Hapus 1 notifikasi tertentu |
| `DELETE` | `/api/notifications` | 🔒 Protected | Bersihkan seluruh notifikasi user (Clear All) |

---

## 🔑 1. Autentikasi (`/api/auth`)

### `POST /api/auth/verify-token` (🔓 Public)
Memverifikasi token login dari Supabase (Google/OTP Phone).
* **Body Request**:
  ```json
  {
    "token": "eyJhbGciOiJFUzI1NiIs..."
  }
  ```
* **Response Sukses (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Token autentikasi valid",
    "data": {
      "user": { "id": "53c82597-7e19-4f35-affa-aac08022c634", "email": "user@gmail.com" }
    }
  }
  ```

### `GET /api/auth/me` (🔒 Protected)
Mengambil informasi sesi user yang sedang aktif login.
* **Response Sukses (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Berhasil mengambil sesi pengguna",
    "data": { "user": { "id": "53c82597-7e19-4f35-affa-aac08022c634", "email": "user@gmail.com" } }
  }
  ```

---

## 👤 2. User Profile & Dasbor (`/api/users`)

### `GET /api/users/profile` (🔒 Protected)
Ambil statistik profil user: total poin, total kg kemasan, dan emisi karbon dihemat.
* **Response Sukses (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Berhasil mengambil profil pengguna",
    "data": {
      "id": "53c82597-7e19-4f35-affa-aac08022c634",
      "full_name": "Indy Agustin",
      "phone_number": "081234567890",
      "avatar_url": "https://avatar.url/image.jpg",
      "total_points": 1250,
      "total_weight_kg": 50.0,
      "total_carbon_saved_kg": 75.0
    }
  }
  ```

### `PUT /api/users/profile` (🔒 Protected)
Mengubah nama, nomor HP, atau foto profil user.
* **Body Request**:
  ```json
  {
    "full_name": "Indy Agustin Baru",
    "phone_number": "081299998888",
    "avatar_url": "https://avatar.url/new-image.jpg"
  }
  ```

### `DELETE /api/users/profile` (🔒 Protected)
Menghapus akun user beserta seluruh riwayatnya secara permanen.

---

## 🗺️ 3. Maps & Stasiun PackCycle (`/api/stations`)

### `GET /api/stations` (🔓 Public)
Ambil daftar lokasi seluruh stasiun untuk ditampilkan pada Peta/Maps aplikasi mobile.

### `GET /api/stations/:id/compartments` (🔓 Public)
Cek status muatan kompartemen di stasiun (Kardus, Bubble Wrap, Tote Bag).
* **Contoh Status**: `AVAILABLE` (Bisa dipakai), `ALMOST_FULL`, `FULL` (Penuh).

---

## ♻️ 4. Setor Kemasan / Drop-off (`/api/deposits`)

### `POST /api/deposits/analyze` (🔒 Protected) — 🤖 AI Scan Packaging
Menganalisis foto kemasan menggunakan **Google Gemini 2.5 Flash Vision AI**.
AI secara otomatis mengidentifikasi jenis kemasan, kelayakan fisik, dan menghitung jumlah barang.
* **Body Request**:
  ```json
  {
    "imageBase64": "/9j/4AAQSkZJRgABAQ...",
    "mimeType": "image/jpeg"
  }
  ```
  *(Format gambar yang didukung: `image/jpeg`, `image/png`, `image/webp`. Maks 5MB)*.

* **Response Sukses (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Analisis kemasan berhasil",
    "data": {
      "isEligible": true,
      "status": "LAYAK",
      "wasteType": "TOTE_BAG",
      "quantity": 2,
      "confidenceScore": 0.96,
      "isScreenPhoto": false,
      "reason": "Terdeteksi 2 tote bag kain dalam kondisi bersih dan utuh"
    }
  }
  ```

### `POST /api/deposits` (🔒 Protected)
Mencatat transaksi penyetoran kemasan baru saat user scan QR di mesin stasiun.
* **Body Request**:
  ```json
  {
    "stationId": "11111111-1111-1111-1111-111111111111",
    "compartmentId": "a1111111-1111-1111-1111-111111111111",
    "wasteType": "CARDBOARD",
    "weightOrCount": 1.2
  }
  ```
  *(Catatan: `wasteType` yang valid: `TOTE_BAG`, `PAPER_BAG`. `weightOrCount` harus angka positif > 0)*.

* **Response Sukses (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Setoran kemasan berhasil dicatat!",
    "data": {
      "id": "99999999-9999-9999-9999-999999999999",
      "order_code": "PL-20260724-101",
      "reward_points_earned": 120,
      "carbon_saved_kg": 1.8,
      "status": "DEPOSITED"
    }
  }
  ```

### `GET /api/deposits/:id` (🔒 Protected)
Melihat detail setoran dan status **Order Tracking daur ulang** (`DEPOSITED` ➔ `SORTED` ➔ `PICKED_UP` ➔ `IN_TRANSIT` ➔ `RECYCLED`).

### `DELETE /api/deposits/:id` (🔒 Protected)
Membatalkan transaksi setoran (berlaku jika status masih `DEPOSITED`).

---

## 🎁 5. Reward & E-Wallet (`/api/rewards`)

### `GET /api/rewards/rules` (🔓 Public)
Melihat aturan perhitungan poin & karbon (misal: 1 kg kardus = 100 poin & 1.5 kg CO2 saved).

### `POST /api/rewards/redeem` (🔒 Protected)
Menukarkan poin ke saldo e-wallet (GoPay, OVO, DANA, LinkAja).
* **Body Request**:
  ```json
  {
    "eWalletProvider": "GOPAY",
    "accountNumber": "081234567890",
    "pointsRedeemed": 500
  }
  ```
  *(Catatan: Provider yang valid: `GOPAY`, `OVO`, `DANA`, `LINKAJA`. Minimal penukaran `500` poin)*.

### `DELETE /api/rewards/history/:id` (🔒 Protected)
Membatalkan penukaran poin yang masih `PENDING`. Poin akan otomatis dikembalikan ke akun user.

---

## 🔔 6. Notifikasi (`/api/notifications`)

### `GET /api/notifications` (🔒 Protected)
Mengambil daftar notifikasi milik user.

### `PUT /api/notifications/:id/read` (🔒 Protected)
Menandai notifikasi telah dibaca.

### `DELETE /api/notifications` (🔒 Protected)
Menghapus seluruh notifikasi sekaligus (*Clear All*).

---

## ⚠️ Format Standar Respons Error

Jika terjadi kesalahan (salah input, token habis, dll), API akan selalu mengembalikan format JSON standar berikut:

```json
{
  "success": false,
  "message": "Pesan penjelasan penyebab error",
  "error": "Detail teknis error (atau null)"
}
```

### 🔴 Kode HTTP Error yang Sering Ditemui:
* **`400 Bad Request`**: Salah kirim data (misal: berat bernilai negatif `-5`, jenis kemasan salah, atau ID bukan format UUID).
* **`401 Unauthorized`**: Belum menyertakan token autentikasi atau token sudah kedaluwarsa.
* **`404 Not Found`**: Data yang dicari tidak ada di database.
* **`500 Internal Server Error`**: Gangguan pada server backend.
