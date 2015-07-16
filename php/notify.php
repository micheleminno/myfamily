<?php
require 'sendMail.php';

$json = file_get_contents('php://input');
$data = json_decode($json);

$subject = $data->subject;
$body = $data->body;
$to = $data->to;

if ($data) {

	sendMail($to, $subject, $body);

	$vals = array(
			'subject' => $subject,
			'body' => $body,
			'to' => $to
	);

	echo json_encode($vals);
	exit;

} else {

	echo json_encode(array('error' => TRUE, 'message' => 'a problem occurred'));
	exit;
}


?>