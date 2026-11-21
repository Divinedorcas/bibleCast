<?php

namespace App\Services\Bible;

use RuntimeException;
use Throwable;

/**
 * BibleProviderException
 *
 * Thrown by any BibleProviderInterface implementation when a verse
 * fetch fails. Callers can inspect $code to give targeted UI feedback.
 */
class BibleProviderException extends RuntimeException
{
    /** Network / DNS / timeout error */
    public const ERR_NETWORK   = 1;

    /** Reference string not found (404) */
    public const ERR_NOT_FOUND = 2;

    /** Upstream API returned an unexpected error status */
    public const ERR_UPSTREAM  = 3;

    /** API responded 200 but returned no verses */
    public const ERR_EMPTY     = 4;

    public function __construct(
        string $message = '',
        int $code = 0,
        ?Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }

    /** True if the error is a connectivity / network issue */
    public function isNetworkError(): bool
    {
        return $this->code === self::ERR_NETWORK;
    }

    /** True if the Bible reference itself was invalid */
    public function isNotFound(): bool
    {
        return $this->code === self::ERR_NOT_FOUND;
    }
}
