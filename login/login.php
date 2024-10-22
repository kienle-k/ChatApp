<?php
// Session starten
session_start();

// Statische Anmeldedaten (für Testzwecke hartkodiert)
$valid_username = "user123";
$valid_password = "pass123";

// Wenn das Login-Formular abgeschickt wurde
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['login'])) {
    $username = $_POST['username'];
    $password = $_POST['password'];

    // Überprüfung der Anmeldedaten
    if ($username === $valid_username && $password === $valid_password) {
        // Benutzer ist erfolgreich eingeloggt, speichern der Benutzerdaten in der Session
        $_SESSION['logged_in'] = true;
    } else {
        $login_error = "Falscher Benutzername oder Passwort.";
    }
}

// Logout-Prozess
if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: ".$_SERVER['PHP_SELF']);
    exit();
}
?>

<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login und Formular</title>
</head>
<body>

<?php
// Loginformular anzeigen, wenn der Benutzer nicht eingeloggt ist
if (!isset($_SESSION['logged_in'])): ?>

    <h1>Login</h1>
    <?php if (isset($login_error)): ?>
        <p style="color: red;"><?php echo $login_error; ?></p>
    <?php endif; ?>

    <form method="post" action="">
        <label for="username">Benutzername:</label>
        <input type="text" id="username" name="username" required>
        <br><br>
        
        <label for="password">Passwort:</label>
        <input type="password" id="password" name="password" required>
        <br><br>
        
        <input type="submit" name="login" value="Einloggen">
    </form>

<?php
// Zeigt das Formular nur nach einem erfolgreichen Login
else: ?>

    <h1>Willkommen, <?php echo $_SESSION['firstname'] . " " . $_SESSION['lastname']; ?>!</h1>

<?php endif; ?>

</body>
</html>