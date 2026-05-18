package service;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sliding-window limiter for the password-change endpoint.
 * In-memory by design — HF Spaces sleeps reset state, which is acceptable
 * given BCrypt cost already throttles brute-force throughput.
 */
@Component
public class PasswordChangeRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofHours(1);

    private final Map<Long, Deque<Instant>> attempts = new ConcurrentHashMap<>();

    public synchronized boolean tryConsume(Long userId) {
        Instant now = Instant.now();
        Instant cutoff = now.minus(WINDOW);
        Deque<Instant> q = attempts.computeIfAbsent(userId, k -> new ArrayDeque<>());
        evictBefore(q, cutoff);
        if (q.size() >= MAX_ATTEMPTS) return false;
        q.addLast(now);
        return true;
    }

    public synchronized void clearOnSuccess(Long userId) {
        attempts.remove(userId);
    }

    private static void evictBefore(Deque<Instant> q, Instant cutoff) {
        Iterator<Instant> it = q.iterator();
        while (it.hasNext() && it.next().isBefore(cutoff)) it.remove();
    }
}
