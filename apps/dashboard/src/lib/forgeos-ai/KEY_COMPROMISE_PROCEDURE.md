# ForgeOS Service Key — Compromise Response Procedure

**Classification:** Operational Security Procedure
**Applies to:** All ForgeOS service credentials (`fk_...`)
**Last updated:** 2026-10-09 (Phase 4)

## Trigger

Execute this procedure when:
- A service key (`fk_...`) is suspected or confirmed compromised
- A key was exposed in logs, chat, screenshots, GitHub, or error messages
- A team member with key access departs
- Unusual API usage patterns are detected for a consumer

## Principles

- **Never** display, log, or transmit plaintext keys except during the single
  issuance handoff to the consumer owner.
- **Never** commit keys to GitHub, include them in reports, or paste them in chat.
- **Always** verify the old key is rejected AND the new key works before
  considering the rotation complete.
- **Minimize downtime:** Issue the replacement BEFORE revoking the old key,
  then revoke after the consumer confirms the new key works.

---

## Procedure

### Step 1: Identify the affected key

Determine the `keyId` (16-char hex) of the compromised key. Do NOT use the
plaintext key value for identification.

If you only have the plaintext key, compute the keyId locally:
```bash
# DO NOT run this on a shared machine. DO NOT save the output.
node -e "console.log(require('crypto').createHash('sha256').update('fk_YOUR_KEY_HERE').digest('hex').slice(0,16))"
# Delete terminal history after: history -c
```

### Step 2: Issue a replacement key

**Via admin API** (requires `FORGEOS_ADMIN_TOKEN`):
```bash
curl -X POST https://forgeos.shoppersspotllc.com/api/forgeos-ai/keys \
  -H "Authorization: Bearer $FORGEOS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "<Consumer Name>"}'
```

**Response** (save securely, show plaintext key ONCE):
```json
{
  "key": "fk_...",
  "keyId": "abc123...",
  "name": "<Consumer Name>",
  "hash": "sha256...",
  "instructions": "..."
}
```

- Securely transmit the plaintext `key` to the consumer owner.
- The `keyId` and `hash` go into `FORGEOS_SERVICE_KEYS` (see Step 3).

### Step 3: Update the credential registry

In Vercel Dashboard → forgeos-command-center → Settings → Environment Variables:

1. Read the current `FORGEOS_SERVICE_KEYS` JSON.
2. Add the new key entry:
   ```json
   "<newKeyId>": {
     "hash": "<newHash>",
     "name": "<Consumer Name>",
     "created": "<ISO 8601>",
     "expiresAt": null,
     "revoked": false
   }
   ```
3. **Do NOT yet revoke the old key** — keep it active until Step 5 confirms
   the new key works. This prevents downtime.

### Step 4: Update the consumer secret

The consumer (e.g., God’s Eye, Position AI) stores its `fk_` key server-side.

1. Update the consumer's Vercel environment variable
   (e.g., `FORGEOS_SCOUT_KEY`) with the new plaintext key.
2. Redeploy the consumer project.
3. Verify the consumer's health endpoint or a test request succeeds.

### Step 5: Verify new key works, old key still works (transition)

```bash
# New key should succeed (200)
curl -X POST https://forgeos.shoppersspotllc.com/api/forgeos-ai/chat \
  -H "Authorization: Bearer fk_NEW_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"health check"}]}'

# Old key should still succeed at this stage (not yet revoked)
curl -X POST https://forgeos.shoppersspotllc.com/api/forgeos-ai/chat \
  -H "Authorization: Bearer fk_OLD_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"health check"}]}'
```

Both should return 200. If the new key fails, STOP — diagnose before revoking.

### Step 6: Revoke the old key

1. In Vercel, edit `FORGEOS_SERVICE_KEYS`:
   - Set `"revoked": true` on the old keyId entry.
   - (Optional) Remove the old entry entirely after 7 days.
2. Redeploy forgeos-command-center.

### Step 7: Verify old key is rejected

```bash
# Old key must now return 401 with code "revoked"
curl -X POST https://forgeos.shoppersspotllc.com/api/forgeos-ai/chat \
  -H "Authorization: Bearer fk_OLD_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
# Expected: {"error":"Invalid ForgeOS service credential","code":"revoked"} (401)
```

### Step 8: Cleanup

- [ ] Delete any files, screenshots, or messages containing the old plaintext key
- [ ] Clear terminal history on any machine where the key was handled
- [ ] Confirm the consumer is operating normally on the new key
- [ ] Record the rotation in the security log (keyId, date, reason — never plaintext)

---

## Quick Reference: Rejection Codes

| Code | Meaning | Action |
|------|---------|--------|
| `missing_credential` | No Authorization header | Client must send `Bearer fk_...` |
| `invalid_format` | Malformed key | Check key starts with `fk_` + 64 hex chars |
| `invalid_credential` | Key not in registry | Check keyId/hash in `FORGEOS_SERVICE_KEYS` |
| `revoked` | Key was revoked | Issue replacement via this procedure |
| `expired` | Key past `expiresAt` | Issue replacement or extend expiry |

---

## Credential Metadata Format

```json
{
  "<keyId>": {
    "hash": "<sha256 of fk_...>",
    "name": "<Consumer Name>",
    "created": "2026-10-09T12:00:00.000Z",
    "expiresAt": null,
    "revoked": false,
    "lastUsed": null
  }
}
```

- `expiresAt`: ISO 8601 timestamp or `null` (no expiry). Expired keys
  return 401 with code `expired`.
- Only SHA-256 hashes are stored. Plaintext keys are never persisted.
- All hash comparisons use timing-safe equality (`crypto.timingSafeEqual`).
