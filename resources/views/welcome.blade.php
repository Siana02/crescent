<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#faf7f3">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="description" content="Crescent is a gentle space to track your cycle, explore lunar phases, and understand your own patterns.">
    <title>Crescent — Your cycle, your rhythm</title>
    @viteReactRefresh
    @vite('resources/js/app.tsx')
</head>
<body>
    <div id="app"></div>
</body>
</html>
