# 🌐 IoT Environmental Monitoring System

Sistem pemantauan lingkungan berbasis **IoT (Internet of Things)** secara *real-time* untuk memonitor **Suhu**, **Kelembaban**, dan **Intensitas Cahaya**. Proyek ini mengintegrasikan mikrokontroler **ESP8266**, protokol **MQTT (EMQX)**, pipeline data otomatis menggunakan **Node-RED**, database **MySQL** yang diorkestrasi menggunakan **Docker Desktop**, pengujian dengan **MQTTX**, serta backend **Express.js** dan dashboard modern **React + Vite**.

---

## 📑 Daftar Isi

- [Arsitektur Sistem](#-arsitektur-sistem)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Struktur Direktori](#-struktur-direktori)
- [Kebutuhan Hardware & Wiring](#-kebutuhan-hardware--wiring)
- [Persiapan & Instalasi Infrastructure (Docker Desktop)](#-persiapan--instalasi-infrastructure-docker-desktop)
  - [1. Menjalankan Docker Compose](#1-menjalankan-docker-compose)
  - [2. Setup Database MySQL](#2-setup-database-mysql)
- [Konfigurasi Node-RED](#-konfigurasi-node-red)
- [Pengujian & Simulasi dengan MQTTX](#-pengujian--simulasi-dengan-mqttx)
- [Setup Firmware ESP8266 (Arduino IDE)](#-setup-firmware-esp8266-arduino-ide)
- [Setup Backend (Node.js & Express)](#-setup-backend-nodejs--express)
- [Setup Frontend Dashboard (React + Vite)](#-setup-frontend-dashboard-react--vite)
- [Dokumentasi REST API](#-dokumentasi-rest-api)
- [Troubleshooting](#-troubleshooting)

---

## 🏗 Arsitektur Sistem

Aliran data (*data pipeline*) dari sensor fisik hingga ditampilkan pada antarmuka web:

```
+------------------------+
|    Sensor Lingkungan   |
|   (DHT11 & LDR Cahaya) |
+-----------+------------+
            | (Analog/Digital Read)
+-----------v------------+
|   NodeMCU ESP8266      |
|  (Publisher via WiFi)  |
+-----------+------------+
            | (MQTT Publish: monitoring/#)
            v
+--------------------------------------------------------+
|                  DOCKER DESKTOP CONTAINER             |
|                                                        |
|  +--------------------+         +-------------------+  |
|  |    EMQX Broker     |<------->|       MQTTX       |  |
|  |   (Port 1883)      |         |  (Testing Client) |  |
|  +---------+----------+         +-------------------+  |
|            | (MQTT Subscribe)                          |
|  +---------v----------+                                |
|  |     Node-RED       |                                |
|  | (Data Pipeline     |                                |
|  |  & Auto Cleanup)   |                                |
|  +---------+----------+                                |
|            | (Insert query)                            |
|  +---------v----------+                                |
|  |    MySQL Database  |                                |
|  | (Table sensor_data)|                                |
|  +---------+----------+                                |
+------------|-------------------------------------------+
             | (Query data)
+------------v-----------+
|    Node.js Backend     | (Express API - Port 3000)
+------------+-----------+
             | (REST API / Polling)
+------------v-----------+
|    React Web App       | (Vite + Recharts - Port 5173)
+------------------------+
```

---

## 🛠 Teknologi yang Digunakan

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Microcontroller** | NodeMCU ESP8266 | Membaca sensor & mengirim data via WiFi (MQTT) |
| **Sensors** | DHT11 & LDR | Sensor Suhu/Kelembaban & Sensor Intensitas Cahaya |
| **Container Platform** | Docker Desktop | Mengisolasi dan menjalankan EMQX, MySQL, & Node-RED |
| **MQTT Broker** | EMQX Broker (`port 1883`) | Message broker berkinerja tinggi |
| **MQTT Client Tester** | MQTTX | Tool GUI untuk pengujian, monitoring, & simulasi data MQTT |
| **Pipeline & Orchestrator** | Node-RED (`port 1880`) | Integrasi dataflow MQTT ke MySQL, WebSockets, & UI |
| **Database** | MySQL (`port 3306`) | Menyimpan riwayat data sensor (`iot_monitoring`) |
| **Backend REST API** | Express.js & MySQL2 | Menyediakan endpoint data sensor realtime & riwayat |
| **Frontend Web App** | React 19, Vite, Recharts, Lucide | Tampilan dashboard modern dengan grafik interaktif |

---

## 📁 Struktur Direktori

```text
IoT/
├── IoT.ino                     # Firmware Arduino untuk ESP8266
├── docker-compose.yml          # Konfigurasi container Docker Desktop (EMQX, MySQL, Node-RED)
├── node-red-flows.json         # Export template flow Node-RED
├── .gitignore                  # Mengabaikan file sensitif & dependencies
├── backend/
│   ├── .env.example            # Template konfigurasi environment database
│   ├── package.json            # Dependencies Express & MySQL2
│   └── server.js               # Backend REST API
└── iot-monitoring/             # Frontend Dashboard (React + Vite)
    ├── package.json
    ├── vite.config.js
    ├── src/
    │   ├── App.jsx             # Komponen Dashboard utama & Chart
    │   ├── App.css             # Styling tema modern dark glassmorphism
    │   └── main.jsx
    └── index.html
```

---

## 🔌 Kebutuhan Hardware & Wiring

### Daftar Komponen:
- 1x NodeMCU ESP8266 (ESP-12E / sejenis)
- 1x Sensor Suhu & Kelembaban DHT11
- 1x Sensor Cahaya LDR (Photoresistor)
- 1x Resistor 10k Ohm (sebagai voltage divider untuk LDR)
- Breadboard & Kabel Jumper secukupnya
- Kabel Micro-USB untuk koneksi daya/flashing

### Skema Pinout:

| Sensor | Pin Sensor | Pin ESP8266 | Keterangan |
| :--- | :--- | :--- | :--- |
| **DHT11** | VCC | 3V3 / 3.3V | Catu daya |
| **DHT11** | GND | GND | Ground |
| **DHT11** | DATA / OUT | **D4** (GPIO 2) | Data sinyal digital |
| **LDR** | Kaki 1 | 3V3 | Catu daya |
| **LDR** | Kaki 2 | **A0** (ADC) | Terhubung ke A0 dan Resistor 10k ke GND |
| **Resistor 10k** | Kaki 1 & 2 | Pin A0 & GND | Pembagi tegangan (*pull-down*) |

---

## 🐳 Persiapan & Instalasi Infrastructure (Docker Desktop)

Pastikan [Docker Desktop](https://www.docker.com/products/docker-desktop/) sudah terinstal dan dalam kondisi berjalan (*running*).

### 1. Menjalankan Docker Compose

Jalankan perintah berikut di root folder proyek:

```powershell
docker compose up -d
```

Perintah di atas akan secara otomatis mengunduh (*pull*) dan mengaktifkan 3 layanan:
- **EMQX (MQTT Broker)**: `localhost:1883` (Dashboard: `http://localhost:18083` | User: `admin`, Pass: `public`)
- **MySQL Database**: `localhost:3306` (User: `nodered`, Pass: `Nodered@123`, DB: `iot_monitoring`)
- **Node-RED**: `http://localhost:1880`

### 2. Setup Database MySQL

Jika tabel belum otomatis dibuat, Anda dapat mengeksekusi script SQL berikut di dalam container MySQL:

```sql
CREATE DATABASE IF NOT EXISTS iot_monitoring;
USE iot_monitoring;

CREATE TABLE IF NOT EXISTS sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    ldr_raw INT,
    light DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Atau jalankan langsung melalui terminal:

```powershell
docker exec -i iot-mysql mysql -unodered -pNodered@123 iot_monitoring -e "
CREATE TABLE IF NOT EXISTS sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    ldr_raw INT,
    light DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);"
```

---

## 🔴 Konfigurasi Node-RED

Node-RED bertindak sebagai pusat pemrosesan data antara MQTT dan MySQL.

1. Buka browser dan akses **`http://localhost:1880`**.
2. Klik tombol Menu (tiga garis di kanan atas) ➔ **Import**.
3. Pilih file **`node-red-flows.json`** yang ada di repositori ini, lalu klik **Import**.
4. Flow ini mencakup:
   - **MQTT In**: Mengambil data dari topik `monitoring/temperature`, `monitoring/humidity`, `monitoring/ldr/raw`, `monitoring/ldr/light`.
   - **Function Node 1**: Menggabungkan data sensor menjadi 1 objek utuh ketika semua data telah diterima, lalu membentuk query `INSERT INTO sensor_data`.
   - **MySQL Node**: Menyimpan data ke tabel `sensor_data`.
   - **Function Node 2 (Auto Cleanup)**: Menghapus data lama secara otomatis agar database hanya menyimpan 100 data terbaru (*optimasi memori*).
   - **WebSocket Out**: Meneruskan data realtime ke endpoint `/sensor`.
   - **UI Dashboard**: Tampilan visual bawaan Node-RED di **`http://localhost:1880/ui`**.
5. Klik **Deploy** di kanan atas.

---

## 📡 Pengujian & Simulasi dengan MQTTX

[MQTTX](https://mqttx.app/) digunakan untuk memonitor lalu lintas data MQTT secara visual atau melakukan simulasi sensor tanpa perangkat keras.

### 1. Menghubungkan ke Broker
- Buka **MQTTX** ➔ Klik tanda **+** (New Connection).
- **Name**: `Local EMQX`
- **Host**: `127.0.0.1` (atau IP WiFi Hotspot Anda jika dari perangkat lain)
- **Port**: `1883`
- **Protocol**: `mqtt://`
- Klik **Connect**.

### 2. Berlangganan Topik (*Subscribe*)
Klik **+ New Subscription** untuk memantau data yang dikirim ESP8266:
- **Topic**: `monitoring/#`
- **QoS**: `0`

### 3. Simulasi Pengiriman Data (*Publish*)
Jika perangkat ESP8266 belum dinyalakan, Anda bisa menguji sistem dengan mem-publish data tiruan berikut:

| Topik | Payload | Tipe |
| :--- | :--- | :--- |
| `monitoring/temperature` | `28.50` | Plaintext |
| `monitoring/humidity` | `70.00` | Plaintext |
| `monitoring/ldr/raw` | `620` | Plaintext |
| `monitoring/ldr/light` | `60` | Plaintext |

Setelah ke-4 topik tersebut terkirim, periksa Node-RED atau database MySQL untuk memastikan data tersimpan.

---

## ⚡ Setup Firmware ESP8266 (Arduino IDE)

1. Buka file **`IoT.ino`** menggunakan Arduino IDE.
2. Pasang library yang diperlukan melalui **Tools ➔ Manage Libraries**:
   - `PubSubClient` (oleh Nick O'Leary)
   - `DHT sensor library` (oleh Adafruit)
   - `Adafruit Unified Sensor`
3. Sesuaikan konfigurasi WiFi dan IP Broker MQTT pada baris 8–15:
   ```cpp
   // Konfigurasi WiFi
   const char* ssid = "NAMA_WIFI_HOTSPOT";
   const char* password = "PASSWORD_WIFI";

   // IP Komputer/Laptop yang menjalankan Docker Broker MQTT
   const char* mqtt_server = "192.168.137.1"; // Ganti dengan IP laptop Anda
   const int mqtt_port = 1883;
   ```
4. Pilih board **NodeMCU 1.0 (ESP-12E Module)** dan port COM yang sesuai.
5. Klik **Upload**, lalu buka **Serial Monitor** pada baudrate `115200` untuk melihat status koneksi.

---

## 🖥 Setup Backend (Node.js & Express)

1. Masuk ke direktori backend:
   ```powershell
   cd backend
   ```
2. Salin file environment:
   ```powershell
   copy .env.example .env
   ```
   *(Pastikan kredensial di dalam `.env` sesuai dengan konfigurasi container MySQL Anda)*:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=nodered
   DB_PASSWORD=Nodered@123
   DB_DATABASE=iot_monitoring
   ```
3. Install dependencies:
   ```powershell
   npm install
   ```
4. Jalankan backend server:
   ```powershell
   node server.js
   ```
   Server akan aktif di `http://localhost:3000`.

---

## 💻 Setup Frontend Dashboard (React + Vite)

1. Buka terminal baru dan masuk ke direktori frontend:
   ```powershell
   cd iot-monitoring
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Jalankan server pengembangan Vite:
   ```powershell
   npm run dev
   ```
4. Buka tautan yang muncul di browser (biasanya **`http://localhost:5173`**).
5. Dashboard akan secara otomatis memuat data sensor setiap 2 detik dan menampilkan riwayat grafik secara interaktif.

---

## 📋 Dokumentasi REST API

Backend menyediakan endpoint API berbasis JSON:

| Method | Endpoint | Deskripsi | Contoh Respon |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/test` | Menguji status koneksi database | `{"success": true, "message": "Database connected"}` |
| `GET` | `/api/sensor/latest` | Mengambil 1 rekaman data sensor paling baru | `{"success": true, "data": {"id": 105, "temperature": 29.2, "humidity": 68.0, "ldr_raw": 512, "light": 50.0, "created_at": "..."}}` |
| `GET` | `/api/sensor/history` | Mengambil hingga 100 riwayat data sensor untuk grafik | `{"success": true, "data": [...]}` |

---

## ❓ Troubleshooting

1. **ESP8266 tidak bisa terhubung ke MQTT Broker (`rc=-2`):**
   - Pastikan laptop dan ESP8266 berada dalam jaringan WiFi/Hotspot yang sama.
   - Pastikan Windows Firewall tidak memblokir port `1883`. Tambahkan inbound rule untuk port `1883` jika diperlukan.
   - Periksa kembali alamat IP `mqtt_server` pada kode `IoT.ino` (gunakan `ipconfig` di PowerShell untuk melihat IP IPv4 laptop Anda).

2. **Container Docker tidak dapat diakses:**
   - Buka Docker Desktop dan pastikan status container `emqx`, `iot-mysql`, dan `mynodered` dalam keadaan **Running** (hijau).
   - Jalankan `docker ps` untuk memastikan tidak ada konflik port.

3. **Node-RED gagal konek ke MySQL (`ECONNREFUSED`):**
   - Jika Node-RED berada dalam jaringan Docker yang sama (`iot_network`), gunakan hostname `iot-mysql` sebagai DB host di Node-RED, bukan `localhost`.
   - Jika Node-RED mengakses dari luar container, gunakan `host.docker.internal` atau IP lokal host.

4. **Frontend menampilkan status Offline:**
   - Pastikan backend `server.js` di folder `backend/` sedang berjalan pada port `3000`.
   - Pastikan database memiliki data di tabel `sensor_data`.

---

## 📜 Lisensi

Proyek ini berada di bawah lisensi [MIT License](LICENSE).
Silakan gunakan dan kembangkan untuk kebutuhan edukasi, riset, atau implementasi praktis.