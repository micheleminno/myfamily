<?php
require 'PHPMailerAutoload.php';

function sendMail($address, $subject, $body) {
	
	$mail = new PHPMailer;
	
	$mail->isSMTP();                                      // Set mailer to use SMTP
	
	$mail->Host = 'smtp.gmail.com';      // Specify main and backup SMTP servers
	$mail->SMTPAuth = true;                               // Enable SMTP authentication
	$mail->Username = 'familyplace.notifications@gmail.com';    // SMTP username
	$mail->Password = 'familyplace1029';                     // SMTP password
	$mail->SMTPSecure = 'ssl';                            // Enable TLS encryption, `ssl` also accepted
	$mail->Port = 465;                                    // TCP port to connect to
	
	$mail->From = 'familyplace.notifications@gmail.com';
	$mail->FromName = 'family.place';
	
	$mail->addAddress($address);     // Add a recipient
	
	/*
	$mail->addAddress('ellen@example.com');               // Name is optional
	$mail->addReplyTo('info@example.com', 'Information');
	$mail->addCC('cc@example.com');
	$mail->addBCC('bcc@example.com');
	
	$mail->addAttachment('/var/tmp/file.tar.gz');         // Add attachments
	$mail->addAttachment('/tmp/image.jpg', 'new.jpg');    // Optional name
	$mail->isHTML(true);                                  // Set email format to HTML
	
	*/
	
	$mail->Subject = $subject;
	$mail->Body    = $body;
	//$mail->AltBody = 'This is the body in plain text for non-HTML mail clients';
	
	if(!$mail->send()) {
		return false;
	} else {
		return true;
	}
}

