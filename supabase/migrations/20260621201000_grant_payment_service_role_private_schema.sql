-- Module 6 hardening: privileged Edge Function RPC wrappers invoke private
-- security-definer transitions, so service_role needs schema resolution.

grant usage on schema private to service_role;

revoke all on function private.register_razorpay_order(
  uuid, uuid, text, integer, text, text, timestamptz
) from public, anon, authenticated;
revoke all on function private.release_razorpay_order_claim(
  uuid, uuid, text, text
) from public, anon, authenticated;
revoke all on function private.mark_razorpay_payment_processing(
  text, text, integer, text, text
) from public, anon, authenticated;
revoke all on function private.process_razorpay_webhook(
  text, text, text, jsonb, text, text, integer, text, text
) from public, anon, authenticated;

grant execute on function private.register_razorpay_order(
  uuid, uuid, text, integer, text, text, timestamptz
) to service_role;
grant execute on function private.release_razorpay_order_claim(
  uuid, uuid, text, text
) to service_role;
grant execute on function private.mark_razorpay_payment_processing(
  text, text, integer, text, text
) to service_role;
grant execute on function private.process_razorpay_webhook(
  text, text, text, jsonb, text, text, integer, text, text
) to service_role;
