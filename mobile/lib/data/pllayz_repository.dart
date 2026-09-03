import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

typedef Json = Map<String, dynamic>;

List<Json> jsonRows(dynamic value) {
  if (value is! List) return const [];
  return value
      .whereType<Map>()
      .map((row) => Map<String, dynamic>.from(row))
      .toList();
}

Json? jsonRow(dynamic value) {
  if (value is Map) return Map<String, dynamic>.from(value);
  if (value is List && value.isNotEmpty && value.first is Map) {
    return Map<String, dynamic>.from(value.first as Map);
  }
  return null;
}

class CatalogBundle {
  const CatalogBundle({
    required this.venues,
    required this.courts,
    required this.sports,
    required this.courtSports,
    required this.slots,
  });

  final List<Json> venues;
  final List<Json> courts;
  final List<Json> sports;
  final List<Json> courtSports;
  final List<Json> slots;
}

class BookingBundle {
  const BookingBundle({
    required this.holds,
    required this.payments,
    required this.bookings,
    required this.posts,
  });

  final List<Json> holds;
  final List<Json> payments;
  final List<Json> bookings;
  final List<Json> posts;
}

class OwnerBundle {
  const OwnerBundle({
    required this.venues,
    required this.images,
    required this.approvals,
    required this.courts,
    required this.courtSports,
    required this.sports,
    required this.rules,
    required this.slots,
    required this.holds,
    required this.payments,
    required this.bookings,
    required this.commissions,
    required this.logs,
  });

  final List<Json> venues;
  final List<Json> images;
  final List<Json> approvals;
  final List<Json> courts;
  final List<Json> courtSports;
  final List<Json> sports;
  final List<Json> rules;
  final List<Json> slots;
  final List<Json> holds;
  final List<Json> payments;
  final List<Json> bookings;
  final List<Json> commissions;
  final List<Json> logs;
}

class PllayzRepository {
  PllayzRepository(this.client);

  final SupabaseClient client;
  static const _uuid = Uuid();

  User? get user => client.auth.currentUser;

  Future<Json?> profile() async {
    final id = user?.id;
    if (id == null) return null;
    final value = await client
        .from('profiles')
        .select()
        .eq('id', id)
        .maybeSingle();
    return value == null ? null : Map<String, dynamic>.from(value);
  }

  Future<Json> ensureProfile(String accountType) async {
    final value = await client.rpc(
      'ensure_my_profile',
      params: {'p_account_type': accountType},
    );
    return jsonRow(value) ?? <String, dynamic>{};
  }

  Future<Json> updateProfile({
    required String fullName,
    required String city,
    String? businessName,
  }) async {
    final value = await client.rpc(
      'update_my_profile',
      params: {
        'p_full_name': fullName.trim(),
        'p_city': city,
        'p_business_name': businessName == null || businessName.trim().isEmpty
            ? null
            : businessName.trim(),
      },
    );
    return jsonRow(value) ?? <String, dynamic>{};
  }

  Future<CatalogBundle> catalog() async {
    final now = DateTime.now().toUtc().toIso8601String();
    await client.rpc('refresh_demo_catalog_slots');
    final results = await Future.wait<dynamic>([
      client
          .from('venue_catalog')
          .select()
          .order('sort_priority')
          .order('name'),
      client.from('courts').select().eq('is_active', true).order('name'),
      client.from('sports').select().eq('is_active', true).order('name'),
      client.from('court_sports').select().eq('is_active', true),
      client
          .from('slots')
          .select()
          .eq('status', 'available')
          .gt('start_time', now)
          .order('start_time')
          .limit(1000),
    ]);
    return CatalogBundle(
      venues: jsonRows(results[0]),
      courts: jsonRows(results[1]),
      sports: jsonRows(results[2]),
      courtSports: jsonRows(results[3]),
      slots: jsonRows(results[4]),
    );
  }

  Future<BookingBundle> bookingActivity() async {
    await client.rpc('expire_booking_holds');
    try {
      await client.rpc('expire_matchmaking_posts');
    } catch (_) {
      // Older environments can still show bookings without matchmaking.
    }
    final results = await Future.wait<dynamic>([
      client
          .from('booking_holds')
          .select()
          .order('created_at', ascending: false),
      client.from('payments').select().order('created_at', ascending: false),
      client.from('bookings').select().order('created_at', ascending: false),
      client
          .from('matchmaking_posts')
          .select()
          .order('created_at', ascending: false),
    ]);
    return BookingBundle(
      holds: jsonRows(results[0]),
      payments: jsonRows(results[1]),
      bookings: jsonRows(results[2]),
      posts: jsonRows(results[3]),
    );
  }

  Future<List<Json>> matchmakingFeed() async {
    await client.rpc('refresh_demo_catalog_slots');
    await client.rpc('expire_matchmaking_posts');
    final value = await client
        .from('matchmaking_feed')
        .select()
        .order('snapshot_start_time');
    return jsonRows(value);
  }

  Future<Json> createHold(String slotId) async {
    final value = await client.rpc(
      'create_booking_hold',
      params: {'p_slot_id': slotId},
    );
    return jsonRow(value) ?? <String, dynamic>{};
  }

  Future<Json> cancelHold(String holdId) async {
    final value = await client.rpc(
      'cancel_my_booking_hold',
      params: {'p_hold_id': holdId},
    );
    return jsonRow(value) ?? <String, dynamic>{};
  }

  Future<Json> createMatchPost({
    required String bookingId,
    required String teamName,
    String? skill,
    String? note,
  }) async {
    final value = await client.rpc(
      'create_matchmaking_post',
      params: {
        'p_booking_id': bookingId,
        'p_team_name': teamName.trim(),
        'p_skill_level': _nullable(skill),
        'p_note': _nullable(note),
      },
    );
    return jsonRow(value) ?? <String, dynamic>{};
  }

  Future<Json> joinMatchPost({
    required String postId,
    required String teamName,
    String? note,
  }) async {
    final value = await client.rpc(
      'join_matchmaking_post',
      params: {
        'p_post_id': postId,
        'p_team_name': teamName.trim(),
        'p_note': _nullable(note),
      },
    );
    return jsonRow(value) ?? <String, dynamic>{};
  }

  Future<Json> cancelMatchPost(String postId) async {
    final value = await client.rpc(
      'cancel_my_matchmaking_post',
      params: {'p_post_id': postId},
    );
    return jsonRow(value) ?? <String, dynamic>{};
  }

  Future<Json> createPaymentOrder(String holdId) async {
    final response = await client.functions.invoke(
      'razorpay-order',
      body: {'hold_id': holdId},
    );
    final row = jsonRow(response.data);
    if (row == null) throw StateError('Payment order returned no data.');
    return row;
  }

  Future<Json> verifyPaymentReturn({
    required String orderId,
    required String paymentId,
    required String signature,
  }) async {
    final response = await client.functions.invoke(
      'razorpay-payment-return',
      body: {
        'razorpay_order_id': orderId,
        'razorpay_payment_id': paymentId,
        'razorpay_signature': signature,
      },
    );
    return jsonRow(response.data) ?? <String, dynamic>{};
  }

  Future<OwnerBundle> ownerDashboard() async {
    await client.rpc('expire_booking_holds');
    final now = DateTime.now().toUtc().toIso8601String();
    final results = await Future.wait<dynamic>([
      client.from('venues').select().order('created_at', ascending: false),
      client.from('venue_images').select().order('sort_order'),
      client.from('venue_approvals').select(),
      client.from('courts').select().order('created_at'),
      client.from('court_sports').select(),
      client.from('sports').select().eq('is_active', true).order('name'),
      client.from('weekly_availability_rules').select().order('weekday'),
      client
          .from('slots')
          .select()
          .gte('start_time', now)
          .order('start_time')
          .limit(1200),
      client
          .from('booking_holds')
          .select()
          .order('created_at', ascending: false)
          .limit(50),
      client
          .from('payments')
          .select()
          .order('created_at', ascending: false)
          .limit(50),
      client
          .from('bookings')
          .select()
          .order('created_at', ascending: false)
          .limit(50),
      client
          .from('commission_records')
          .select()
          .order('created_at', ascending: false)
          .limit(50),
      client
          .from('owner_operation_logs')
          .select()
          .order('created_at', ascending: false)
          .limit(50),
    ]);
    return OwnerBundle(
      venues: jsonRows(results[0]),
      images: jsonRows(results[1]),
      approvals: jsonRows(results[2]),
      courts: jsonRows(results[3]),
      courtSports: jsonRows(results[4]),
      sports: jsonRows(results[5]),
      rules: jsonRows(results[6]),
      slots: jsonRows(results[7]),
      holds: jsonRows(results[8]),
      payments: jsonRows(results[9]),
      bookings: jsonRows(results[10]),
      commissions: jsonRows(results[11]),
      logs: jsonRows(results[12]),
    );
  }

  Future<String> saveVenue({
    String? id,
    required String name,
    required String city,
    required String area,
    required String address,
    required double latitude,
    required double longitude,
    required String description,
    required List<String> amenities,
    required String imageUrl,
  }) async {
    final venueId = id ?? _uuid.v4();
    final payload = <String, dynamic>{
      'name': name.trim(),
      'city': city,
      'area': area.trim(),
      'address': address.trim(),
      'latitude': latitude,
      'longitude': longitude,
      'description': description.trim(),
      'amenities': amenities,
    };
    if (id == null) {
      await client.from('venues').insert({
        'id': venueId,
        'owner_user_id': user!.id,
        'slug': '${_slug(name)}-${venueId.substring(0, 8)}',
        ...payload,
      });
      await client.from('venue_images').insert({
        'id': _uuid.v4(),
        'venue_id': venueId,
        'public_url': imageUrl.trim(),
        'alt_text': '$name sports venue',
        'is_primary': true,
      });
    } else {
      await client.from('venues').update(payload).eq('id', venueId);
      final image = await client
          .from('venue_images')
          .select('id')
          .eq('venue_id', venueId)
          .eq('is_primary', true)
          .maybeSingle();
      if (image == null) {
        await client.from('venue_images').insert({
          'id': _uuid.v4(),
          'venue_id': venueId,
          'public_url': imageUrl.trim(),
          'alt_text': '$name sports venue',
          'is_primary': true,
        });
      } else {
        await client
            .from('venue_images')
            .update({'public_url': imageUrl.trim(), 'alt_text': '$name venue'})
            .eq('id', image['id']);
      }
    }
    return venueId;
  }

  Future<void> deleteVenue(String id) =>
      client.from('venues').delete().eq('id', id);

  Future<String> saveCourt({
    String? id,
    required String venueId,
    required String name,
    required String type,
    required int duration,
    required num price,
    required List<String> sportIds,
  }) async {
    final courtId = id ?? _uuid.v4();
    final payload = {
      'name': name.trim(),
      'court_type': type.trim(),
      'default_duration_minutes': duration,
      'base_price': price,
      'is_active': true,
    };
    if (id == null) {
      await client.from('courts').insert({
        'id': courtId,
        'venue_id': venueId,
        ...payload,
      });
    } else {
      await client.from('courts').update(payload).eq('id', courtId);
    }
    final existing = jsonRows(
      await client.from('court_sports').select().eq('court_id', courtId),
    );
    for (final row in existing) {
      await client
          .from('court_sports')
          .update({'is_active': sportIds.contains(row['sport_id'])})
          .eq('court_id', courtId)
          .eq('sport_id', row['sport_id']);
    }
    final existingIds = existing.map((e) => e['sport_id']).toSet();
    final additions = sportIds.where((id) => !existingIds.contains(id));
    if (additions.isNotEmpty) {
      await client
          .from('court_sports')
          .insert(
            additions
                .map(
                  (sportId) => {
                    'court_id': courtId,
                    'sport_id': sportId,
                    'duration_minutes': duration,
                    'is_active': true,
                  },
                )
                .toList(),
          );
    }
    return courtId;
  }

  Future<void> saveRule({
    required String courtId,
    required String sportId,
    required int weekday,
    required String opens,
    required String closes,
    required int duration,
    required num price,
  }) async {
    await client.from('weekly_availability_rules').insert({
      'court_id': courtId,
      'sport_id': sportId,
      'weekday': weekday,
      'start_local': opens,
      'end_local': closes,
      'duration_minutes': duration,
      'price_total': price,
      'is_active': true,
      'created_by': user!.id,
    });
  }

  Future<void> toggleRule(String id, bool active) => client
      .from('weekly_availability_rules')
      .update({'is_active': active})
      .eq('id', id);

  Future<void> deleteRule(String id) =>
      client.from('weekly_availability_rules').delete().eq('id', id);

  Future<void> refreshVenueSlots(String venueId) =>
      client.rpc('refresh_my_venue_slots', params: {'p_venue_id': venueId});

  Future<void> submitVenue(String venueId) =>
      client.rpc('submit_my_venue_for_review', params: {'p_venue_id': venueId});

  Future<void> blockSlot(String slotId, bool blocked, {String? reason}) =>
      client.rpc(
        'set_my_slot_block',
        params: {
          'p_slot_id': slotId,
          'p_blocked': blocked,
          'p_reason': blocked ? (reason ?? 'Owner unavailable') : null,
        },
      );

  static String? _nullable(String? value) =>
      value == null || value.trim().isEmpty ? null : value.trim();

  static String _slug(String value) {
    final slug = value
        .toLowerCase()
        .trim()
        .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
        .replaceAll(RegExp(r'^-+|-+$'), '');
    return slug.isEmpty ? 'venue' : slug.substring(0, slug.length.clamp(0, 70));
  }
}
