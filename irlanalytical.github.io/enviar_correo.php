<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'src/Exception.php';
require 'src/PHPMailer.php';
require 'src/SMTP.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nombre = htmlspecialchars($_POST['nombre']);
    $email = htmlspecialchars($_POST['email']);
    $mensaje = htmlspecialchars($_POST['mensaje']);

    $mail = new PHPMailer(true);

    try {
        // Configuración del servidor SMTP
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com'; // Servidor SMTP de Gmail
        $mail->SMTPAuth = true;
        $mail->Username = 'ricardoisay1234@gmail.com'; // Tu correo
        $mail->Password = 'i09#FW7h'; // Tu contraseña
        $mail->SMTPSecure = 'tls';
        $mail->Port = 587;

        // Destinatarios
        $mail->setFrom($email, $nombre);
        $mail->addAddress('ricardoportilla986@gmail.com'); // Correo del destinatario

        // Contenido del correo
        $mail->isHTML(false);
        $mail->Subject = "Nuevo mensaje de contacto de $nombre";
        $mail->Body = "Nombre: $nombre\nEmail: $email\nMensaje:\n$mensaje";

        $mail->send();
        echo "<p style='color: green;'>Mensaje enviado con éxito.</p>";
    } catch (Exception $e) {
        echo "<p style='color: red;'>Error al enviar el mensaje: {$mail->ErrorInfo}</p>";
    }
}
?>