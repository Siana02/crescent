<?php

namespace App\Http\Controllers;

use App\Models\Relationship;
use App\Models\RelationshipNote;
use App\Services\CrescentPushService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class RelationshipNotesController extends Controller
{
    private function ensureParticipant(Relationship $relationship, Request $request): void
    {
        abort_unless(
            in_array($request->user()->id, [$relationship->user_one_id, $relationship->user_two_id], true)
            && $relationship->status === 'accepted',
            404
        );
    }

    public function index(Relationship $relationship, Request $request): JsonResponse
    {
        $this->ensureParticipant($relationship, $request);
        $userId = $request->user()->id;
        $timezone = $request->user()->cycleProfile?->timezone ?: config('app.timezone', 'UTC');
        $today = CarbonImmutable::today($timezone);

        $unreadQuery = RelationshipNote::query()
            ->where('relationship_id', $relationship->id)
            ->where('author_id', '!=', $userId)
            ->whereNull('read_at');
        $authorsToNotify = (clone $unreadQuery)->distinct()->pluck('author_id');
        $unreadQuery->update(['read_at' => now(), 'updated_at' => now()]);
        foreach ($authorsToNotify as $authorId) {
            try {
                app(CrescentPushService::class)->notify((int) $authorId, 'note_read');
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        $notes = RelationshipNote::with('author:id,name')
            ->where('relationship_id', $relationship->id)
            ->orderBy('note_date')
            ->orderBy('created_at')
            ->get()
            ->map(fn (RelationshipNote $note) => [
                'id' => $note->id,
                'author_id' => $note->author_id,
                'author_name' => $note->author?->name ?? 'Your companion',
                'note_date' => $note->note_date->format('Y-m-d'),
                'body' => $note->body,
                'is_mine' => $note->author_id === $userId,
                'read_at' => $note->read_at?->toIso8601String(),
                'created_at' => $note->created_at?->toIso8601String(),
            ]);

        $todayNote = RelationshipNote::query()
            ->where('relationship_id', $relationship->id)
            ->where('author_id', $userId)
            ->whereDate('note_date', $today->toDateString())
            ->latest('id')
            ->first();

        return response()->json([
            'notes' => $notes->values(),
            'can_write' => $relationship->relationship_type === 'co_tracker' || $relationship->user_one_id === $userId,
            'today_note' => $todayNote ? [
                'id' => $todayNote->id,
                'body' => $todayNote->body,
                'read_at' => $todayNote->read_at?->toIso8601String(),
            ] : null,
        ]);
    }

    public function store(Relationship $relationship, Request $request): JsonResponse
    {
        $this->ensureParticipant($relationship, $request);
        $userId = $request->user()->id;

        if ($relationship->relationship_type !== 'co_tracker' && $relationship->user_one_id !== $userId) {
            throw ValidationException::withMessages([
                'body' => 'This connection is a one-way support note space. Your partner can send notes here, and you can read and acknowledge them.',
            ]);
        }

        $validated = $request->validate([
            'body' => ['required', 'string', 'min:1', 'max:1200'],
        ]);
        if (trim($validated['body']) === '') {
            throw ValidationException::withMessages(['body' => 'Write a little note before saving.']);
        }

        $timezone = $request->user()->cycleProfile?->timezone ?: config('app.timezone', 'UTC');
        $today = CarbonImmutable::today($timezone)->toDateString();
        $sentToday = RelationshipNote::query()
            ->where('relationship_id', $relationship->id)
            ->where('author_id', $userId)
            ->whereDate('note_date', $today)
            ->count();
        if ($sentToday >= 60) {
            throw ValidationException::withMessages(['body' => 'You have sent plenty of messages today. Try again tomorrow.']);
        }

        $note = RelationshipNote::create([
            'relationship_id' => $relationship->id,
            'author_id' => $userId,
            'note_date' => $today,
            'body' => trim($validated['body']),
        ]);

        $recipientId = $relationship->user_one_id === $userId ? $relationship->user_two_id : $relationship->user_one_id;
        if ($recipientId) {
            app(CrescentPushService::class)->notify((int) $recipientId, 'shared_note');
        }

        return response()->json([
            'message' => 'Your message has been sent.',
            'note' => [
                'id' => $note->id,
                'body' => $note->body,
                'note_date' => $note->note_date->format('Y-m-d'),
                'read_at' => $note->read_at?->toIso8601String(),
            ],
        ], 201);
    }
}
