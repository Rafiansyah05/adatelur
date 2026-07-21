Coding Guidelines
Objective

Seluruh source code harus terlihat seperti ditulis oleh programmer profesional.

Prioritaskan keterbacaan, konsistensi, maintainability, dan kemudahan pengembangan jangka panjang.

Kode harus mudah dipahami oleh programmer lain tanpa perlu penjelasan tambahan.

Scope

Aturan ini berlaku untuk seluruh project.

Frontend
Backend
API
Database
Component
Utility
Hook
Service
Middleware
Authentication
Dashboard
Landing Page
Admin Panel

Seluruh implementasi baru wajib mengikuti aturan ini.

General Rules

Selalu gunakan solusi yang paling sederhana.

Jangan membuat solusi yang terlalu kompleks apabila dapat diselesaikan dengan cara yang lebih sederhana.

Selalu prioritaskan clean code dibanding clever code.

Jangan membuat abstraction yang tidak diperlukan.

Jangan membuat generic function apabila hanya digunakan satu kali.

Jangan membuat helper baru apabila logic masih layak ditulis secara langsung.

Gunakan nama variable, function, component, dan file yang jelas.

Contoh yang baik

userProfile
orderHistory
currentFarmer
deliveryAddress

Contoh yang tidak diperbolehkan

a
b
x
temp
data1
test123
Readability

Kode harus mudah dibaca tanpa harus membaca seluruh file.

Gunakan function kecil.

Satu function hanya memiliki satu tanggung jawab.

Gunakan early return.

Kurangi nested if.

Kurangi nested ternary.

Pisahkan logic apabila mulai sulit dipahami.

Simplicity

Selalu gunakan implementasi yang paling sederhana.

Jangan membuat code yang terlalu pintar.

Jangan membuat abstraction hanya demi terlihat rapi.

Kode sederhana lebih diutamakan daripada kode yang terlalu fleksibel namun sulit dipahami.

Consistency

Ikuti style code yang sudah ada.

Jangan mengganti pola coding project tanpa alasan.

Gunakan naming convention yang konsisten.

Ikuti struktur folder yang sudah ada.

Scope Protection

Jangan mengubah:

business logic
tampilan
styling
layout
flow
state
component
API
database

yang tidak berhubungan langsung dengan request.

Hanya ubah bagian yang diminta.

Apabila perubahan dapat memengaruhi halaman lain, gunakan solusi yang lebih terisolasi.

Jangan melakukan refactor apabila tidak diminta.

UI Rules

Gunakan design system project.

Jangan menggunakan shadow.

Jangan menggunakan glow.

Jangan menggunakan gradient yang berlebihan.

Jangan menggunakan warna mencolok.

Gunakan tampilan sederhana, bersih, profesional, dan konsisten.

Gunakan border tipis.

Gunakan spacing yang konsisten.

Jangan mengubah UI halaman lain.

Component Rules

Component hanya memiliki satu tanggung jawab.

Pisahkan logic kompleks ke hook atau utility.

Jangan membuat component yang terlalu besar.

Usahakan setiap component mudah dipahami.

Styling

Gunakan styling yang sudah ada.

Jangan membuat style baru apabila style lama masih dapat digunakan.

Gunakan design token yang tersedia.

Hindari hardcode.

Performance

Hindari render yang tidak diperlukan.

Gunakan batching apabila melakukan banyak update.

Jangan membuat query berulang.

Jangan membuat state yang tidak diperlukan.

Gunakan memoization hanya apabila benar-benar memberikan manfaat.

Naming Rules

Gunakan Bahasa Inggris.

Gunakan camelCase untuk variable dan function.

Gunakan PascalCase untuk component.

Gunakan nama file sesuai isi file.

Gunakan nama yang mudah dipahami.

Jangan menggunakan singkatan yang membingungkan.

Jangan menggunakan seluruh huruf kapital sebagai nama variable, function, constant, atau file kecuali memang diwajibkan oleh library atau framework.

Import Rules

Hapus import yang tidak digunakan.

Jangan melakukan duplicate import.

Ikuti urutan import yang konsisten.

Import hanya dependency yang benar-benar digunakan.

Logic Rules

Jangan mengubah business logic yang sudah berjalan apabila tidak diminta.

Jangan mengubah flow aplikasi.

Jangan mengubah validasi yang sudah ada.

Jangan mengubah perilaku fitur lain.

Comment Rules

Project ini tidak menggunakan komentar pada source code.

Seluruh implementasi harus cukup jelas sehingga tidak membutuhkan komentar.

Dilarang menambahkan komentar dalam bentuk apa pun.

Termasuk tetapi tidak terbatas pada:

// TODO
// FIXME
// NOTE
// HACK
// Temporary
// Main logic
// Utility
// Handle edge case
/* ... */
/**
 * ...
 */
<!-- ... -->

Seluruh komentar khas hasil AI juga tidak diperbolehkan.

Apabila suatu bagian terasa membutuhkan komentar, lakukan refactor terhadap nama function, nama variable, atau struktur logic hingga maksud kode dapat dipahami tanpa komentar.

Komentar hanya diperbolehkan apabila diwajibkan oleh framework, compiler, tooling, atau lisensi open source.

Selain itu, seluruh source code harus bebas dari komentar.

AI Generated Pattern

Source code tidak boleh terlihat seperti hasil AI.

Hindari pola berikut.

Function yang terlalu panjang.
Helper yang berlebihan.
Abstraction yang tidak diperlukan.
Logic yang terlalu kompleks.
Pengulangan code.
Penamaan variable yang tidak jelas.
Implementasi yang terlalu generik.
Perubahan di luar scope request.

Setiap implementasi harus terasa natural dan konsisten dengan keseluruhan project.

Formatting Rules

Gunakan formatting yang konsisten.

Jangan menggunakan seluruh huruf kapital sebagai nama function, variable, constant, atau file.

Jangan membuat section menggunakan karakter dekoratif.

Contoh yang tidak diperbolehkan

--------------------

====================

********************

Gunakan heading dan struktur dokumen yang sederhana.

Jangan menggunakan emoji.

Jangan menggunakan karakter dekoratif yang tidak memiliki fungsi.

Final Validation

Sebelum implementasi selesai, lakukan validasi berikut.

hanya file yang diminta yang diubah
tidak ada perubahan pada halaman lain
tidak ada perubahan pada business logic lain
tidak ada perubahan pada tampilan lain
tidak ada refactor yang tidak diminta
tidak ada komentar pada source code
tidak ada pola implementasi khas AI
tidak ada implementasi yang terlalu kompleks
seluruh implementasi mudah dibaca
seluruh implementasi mudah dipelihara
seluruh implementasi mudah dikembangkan
seluruh implementasi mengikuti design system project
hasil akhir harus terasa seperti ditulis langsung oleh programmer profesional, bukan hasil generasi AI

Prinsip utama: Jika sebuah solusi dapat diselesaikan dengan cara yang lebih sederhana, lebih mudah dibaca, dan lebih mudah dipelihara tanpa mengurangi kualitas, maka gunakan solusi tersebut. Clean code selalu lebih diutamakan daripada kode yang terlalu kompleks.

dan yang paling penting silahkan buat dengan layout yang responsive, adaptive dan mobile first.