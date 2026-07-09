<?php
include 'koneksi.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $target   = mysqli_real_escape_string($conn, $_POST['target']);
    $layanan  = mysqli_real_escape_string($conn, $_POST['layanan']);
    $jumlah   = mysqli_real_escape_string($conn, $_POST['jumlah']);
    $whatsapp = mysqli_real_escape_string($conn, $_POST['whatsapp']);
    
    // Ganti dengan nomor WhatsApp admin Anda (Gunakan kode negara, misal 628xxx)
    $nomor_admin = "6285199239420"; 

    // Membuat template pesan untuk WhatsApp
    $pesan = "Halo Admin, saya ingin order suntik sosmed:\n\n";
    $pesan .= "▪️ *Layanan:* " . $layanan . "\n";
    $pesan .= "▪️ *Target:* " . $target . "\n";
    $pesan .= "▪️ *Jumlah:* " . $jumlah . "\n";
    $pesan .= "▪️ *No. HP Pembeli:* " . $whatsapp . "\n\n";
    $pesan .= "Mohon totalan harga dan instruksi pembayarannya.";

    // Encode text agar aman di URL
    $url_whatsapp = "https://api.whatsapp.com/send?phone=" . $nomor_admin . "&text=" . urlencode($pesan);

    // Alihkan pengguna ke WhatsApp
    header("Location: " . $url_whatsapp);
    exit();
} else {
    header("Location: index.php");
    exit();
}
?>
