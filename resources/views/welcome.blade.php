<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#d8bfdc">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="Crescent">
    <link rel="manifest" href="/manifest.webmanifest">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="apple-touch-icon" href="/crescent-icon.svg">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="description" content="Crescent is a gentle, private space to track your cycle, explore lunar phases, and understand your own patterns.">
    <meta name="robots" content="{{ request()->is('/', 'privacy', 'terms', 'support') ? 'index,follow' : 'noindex,nofollow' }}">
    <meta name="author" content="marswebz">
    <link rel="canonical" href="{{ url(request()->path() === '/' ? '/' : request()->path()) }}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Crescent">
    <meta property="og:title" content="Crescent — Your cycle, your rhythm">
    <meta property="og:description" content="A gentle, private space to track your cycle, explore lunar phases, and understand your own patterns.">
    <meta property="og:url" content="{{ url(request()->path() === '/' ? '/' : request()->path()) }}">
    <meta property="og:image" content="{{ url('/crescent-icon.svg') }}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="Crescent — Your cycle, your rhythm">
    <meta name="twitter:description" content="A gentle, private space to track your cycle, explore lunar phases, and understand your own patterns.">
    <script type="application/ld+json">{!! json_encode(['@context' => 'https://schema.org', '@type' => 'WebApplication', 'name' => 'Crescent', 'url' => url('/'), 'applicationCategory' => 'HealthApplication', 'description' => 'A gentle, private space to track your cycle, explore lunar phases, and understand your own patterns.', 'creator' => ['@type' => 'Organization', 'name' => 'marswebz', 'url' => 'https://www.marswebz.com']], JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) !!}</script>
    <title>Crescent — Your cycle, your rhythm</title>
    @viteReactRefresh
    @vite('resources/js/app.tsx')
</head>
<body>
    <div id="app"></div>
</body>
</html>
