<?php
declare(strict_types=1);

const RECIPIENT_EMAIL = 'contact.orbitwick@gmail.com';
const SENDER_EMAIL = 'noreply@orbitwick.com';

function redirectToForm(string $status): void
{
    header('Location: index.html?contact=' . $status . '#contact', true, 303);
    exit;
}

function postValue(string $key): string
{
    return isset($_POST[$key]) && is_string($_POST[$key]) ? trim($_POST[$key]) : '';
}

function singleLine(string $value): string
{
    return trim(str_replace(["\r", "\n"], ' ', $value));
}

function textLength(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('Method Not Allowed');
}

// A hidden honeypot field can be filled by bots without affecting real visitors.
if (postValue('website_confirm') !== '') {
    redirectToForm('success');
}

$name = singleLine(postValue('name'));
$email = singleLine(postValue('email'));
$company = singleLine(postValue('company'));
$website = singleLine(postValue('website'));
$service = singleLine(postValue('service'));
$timeline = singleLine(postValue('timeline'));
$message = trim(postValue('message'));

$services = [
    'UI/UX & Graphic Design',
    'Full-Stack Web Development',
    'Mobile App Development',
    'Cybersecurity Services',
    'Website Management & Maintenance',
    'Website Revamp & Rebranding',
    'CMS & E-commerce Development',
];

$timelines = [
    '',
    'As soon as possible',
    'Within 1 month',
    '1–3 months',
    '3–6 months',
    'Flexible / not sure yet',
];

$isValid = $name !== '' && textLength($name) <= 120
    && filter_var($email, FILTER_VALIDATE_EMAIL)
    && textLength($email) <= 254
    && textLength($company) <= 160
    && ($website === '' || filter_var($website, FILTER_VALIDATE_URL))
    && in_array($service, $services, true)
    && in_array($timeline, $timelines, true)
    && $message !== '' && textLength($message) <= 5000;

if (!$isValid) {
    redirectToForm('error');
}

$emailBody = "New free consultation request\n\n"
    . "Name: {$name}\n"
    . "Email: {$email}\n"
    . 'Company: ' . ($company !== '' ? $company : 'Not provided') . "\n"
    . 'Website: ' . ($website !== '' ? $website : 'Not provided') . "\n"
    . "Service: {$service}\n"
    . 'Timeline: ' . ($timeline !== '' ? $timeline : 'Not provided') . "\n\n"
    . "Project details:\n{$message}\n";

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: OrbitWick Website <' . SENDER_EMAIL . '>',
    'Reply-To: ' . $email,
];

$sent = mail(
    RECIPIENT_EMAIL,
    'New OrbitWick consultation request',
    $emailBody,
    implode("\r\n", $headers)
);

redirectToForm($sent ? 'success' : 'error');
