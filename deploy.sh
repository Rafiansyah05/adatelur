#!/bin/bash

# Tangkap jika ada error
set -e

echo "======================================"
echo "Memulai proses deployment Adatelur..."
echo "======================================"

# 1. Pastikan berada di direktori project (tempat deploy.sh berada)
cd "$(dirname "$0")"

# 2. Update code dari GitHub (asumsi branch main)
echo "=> Mengambil kode terbaru dari GitHub..."
git pull origin main

# 3. Build & Restart menggunakan Docker Compose
echo "=> Membangun dan menjalankan ulang container (Docker Compose)..."
docker compose up -d --build

# 4. Bersihkan image docker yang sudah tidak terpakai (opsional tapi disarankan)
echo "=> Membersihkan sisa file docker (prune)..."
docker image prune -f

echo "======================================"
echo "Deployment Selesai dan Berhasil!"
echo "Aplikasi berjalan di background via Docker."
echo "======================================"
