import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../data/pllayz_repository.dart';
import '../../ui/app_theme.dart';
import '../../ui/common.dart';

PllayzRepository get _repo => PllayzRepository(Supabase.instance.client);

class PlayerHomePage extends StatefulWidget {
  const PlayerHomePage({required this.onOpen, super.key});
  final ValueChanged<int> onOpen;

  @override
  State<PlayerHomePage> createState() => _PlayerHomePageState();
}

class _PlayerHomePageState extends ReloadableState<PlayerHomePage> {
  late Future<(CatalogBundle, BookingBundle)> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<(CatalogBundle, BookingBundle)> _load() async =>
      (await _repo.catalog(), await _repo.bookingActivity());

  @override
  Future<void> reload() async => setState(() => _future = _load());

  @override
  Widget build(BuildContext context) => PageFrame(
    title: 'Play more.',
    subtitle: 'Book your next game or find a team to face.',
    child: FutureBuilder<(CatalogBundle, BookingBundle)>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return _LoadError(error: snapshot.error, retry: reload);
        }
        if (!snapshot.hasData) return const _LoadingCards();
        final catalog = snapshot.data!.$1;
        final activity = snapshot.data!.$2;
        final upcoming = activity.bookings
            .where(
              (b) =>
                  b['status'] == 'confirmed' &&
                  DateTime.tryParse(
                        '${b['snapshot_start_time']}',
                      )?.isAfter(DateTime.now()) ==
                      true,
            )
            .toList();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _HeroCard(
              onBook: () => widget.onOpen(1),
              onOpponent: () => widget.onOpen(3),
            ),
            const SizedBox(height: 22),
            const SectionTitle('Quick actions'),
            Row(
              children: [
                Expanded(
                  child: _QuickAction(
                    icon: Icons.stadium_rounded,
                    title: 'Book a venue',
                    caption: '${catalog.slots.length} slots live',
                    onTap: () => widget.onOpen(1),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _QuickAction(
                    icon: Icons.groups_2_rounded,
                    title: 'Find opponents',
                    caption: 'Team vs team',
                    onTap: () => widget.onOpen(3),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 22),
            SectionTitle(
              'Your next game',
              trailing: TextButton(
                onPressed: () => widget.onOpen(2),
                child: const Text('All bookings'),
              ),
            ),
            if (upcoming.isEmpty)
              EmptyState(
                icon: Icons.calendar_month_outlined,
                title: 'No upcoming games',
                message: 'Choose a slot and reserve it with a ₹500 advance.',
                action: FilledButton(
                  onPressed: () => widget.onOpen(1),
                  child: const Text('Browse venues'),
                ),
              )
            else
              _BookingCard(booking: upcoming.first),
            const SizedBox(height: 22),
            const SectionTitle('Featured near you'),
            ...catalog.venues
                .take(3)
                .map(
                  (venue) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _VenueCard(
                      venue: venue,
                      onTap: () => _openVenue(context, venue, catalog),
                    ),
                  ),
                ),
          ],
        );
      },
    ),
  );
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.onBook, required this.onOpponent});
  final VoidCallback onBook;
  final VoidCallback onOpponent;

  @override
  Widget build(BuildContext context) =>
      Container(
            constraints: const BoxConstraints(minHeight: 280),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              image: const DecorationImage(
                image: AssetImage('assets/night-match-hero.png'),
                fit: BoxFit.cover,
              ),
            ),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                gradient: const LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0x22000000), Color(0xE6151C19)],
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const StatusPill('854 fresh slots'),
                  const SizedBox(height: 14),
                  Text(
                    'The city is your playground.',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: Colors.white,
                      fontSize: 28,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Reserve a venue, bring your team, and let Pllayz find the opposition.',
                    style: TextStyle(color: Color(0xFFDDE6E2), height: 1.45),
                  ),
                  const SizedBox(height: 18),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      FilledButton.icon(
                        onPressed: onBook,
                        icon: const Icon(Icons.bolt_rounded),
                        label: const Text('Book now'),
                      ),
                      OutlinedButton.icon(
                        onPressed: onOpponent,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: Colors.white54),
                        ),
                        icon: const Icon(Icons.groups_2_rounded),
                        label: const Text('Find opponents'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          )
          .animate()
          .fadeIn(duration: 420.ms)
          .scale(begin: const Offset(.985, .985), curve: Curves.easeOutCubic);
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.title,
    required this.caption,
    required this.onTap,
  });
  final IconData icon;
  final String title;
  final String caption;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => PllayzCard(
    onTap: onTap,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: const BoxDecoration(
            color: PllayzColors.mint,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: PllayzColors.green, size: 21),
        ),
        const SizedBox(height: 14),
        Text(title, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 3),
        Text(caption, style: const TextStyle(fontSize: 12)),
      ],
    ),
  );
}

class PlayerVenuesPage extends StatefulWidget {
  const PlayerVenuesPage({super.key});

  @override
  State<PlayerVenuesPage> createState() => _PlayerVenuesPageState();
}

class _PlayerVenuesPageState extends ReloadableState<PlayerVenuesPage> {
  late Future<CatalogBundle> _future;
  String _city = 'All';
  String _sport = 'All';

  @override
  void initState() {
    super.initState();
    _future = _repo.catalog();
  }

  @override
  Future<void> reload() async => setState(() => _future = _repo.catalog());

  @override
  Widget build(BuildContext context) => PageFrame(
    title: 'Venues',
    subtitle: 'Real availability across Chandigarh, Mohali and Panchkula.',
    child: FutureBuilder<CatalogBundle>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return _LoadError(error: snapshot.error, retry: reload);
        }
        if (!snapshot.hasData) return const _LoadingCards();
        final data = snapshot.data!;
        final sportNames = data.sports
            .map((e) => '${e['name']}')
            .toSet()
            .toList();
        final filtered = data.venues.where((venue) {
          final cityMatch = _city == 'All' || venue['city'] == _city;
          final sports = (venue['sports'] as List?)?.map((e) => '$e') ?? [];
          return cityMatch && (_sport == 'All' || sports.contains(_sport));
        }).toList();
        return Column(
          children: [
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: ['All', 'Chandigarh', 'Mohali', 'Panchkula']
                    .map(
                      (city) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(city),
                          selected: _city == city,
                          onSelected: (_) => setState(() => _city = city),
                        ),
                      ),
                    )
                    .toList(),
              ),
            ),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: ['All', ...sportNames]
                    .map(
                      (sport) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(sport),
                          selected: _sport == sport,
                          onSelected: (_) => setState(() => _sport = sport),
                        ),
                      ),
                    )
                    .toList(),
              ),
            ),
            const SizedBox(height: 18),
            if (filtered.isEmpty)
              const EmptyState(
                icon: Icons.search_off_rounded,
                title: 'No venues match',
                message: 'Try another city or sport filter.',
              )
            else
              ...filtered.map(
                (venue) => Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: _VenueCard(
                    venue: venue,
                    onTap: () => _openVenue(context, venue, data),
                  ),
                ),
              ),
          ],
        );
      },
    ),
  );
}

class _VenueCard extends StatelessWidget {
  const _VenueCard({required this.venue, required this.onTap});
  final Json venue;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => PllayzCard(
    onTap: onTap,
    padding: const EdgeInsets.all(10),
    child: LayoutBuilder(
      builder: (context, constraints) {
        final horizontal = constraints.maxWidth >= 620;
        final photo = VenuePhoto(
          venue['image_url'],
          height: horizontal ? 154 : 170,
        );
        final details = Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '${venue['name']}',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  if (venue['is_featured'] == true)
                    const StatusPill('featured'),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(
                    Icons.location_on_outlined,
                    size: 17,
                    color: PllayzColors.green,
                  ),
                  const SizedBox(width: 4),
                  Expanded(child: Text('${venue['area']}, ${venue['city']}')),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 7,
                runSpacing: 7,
                children: ((venue['sports'] as List?) ?? const [])
                    .take(4)
                    .map(
                      (sport) => Chip(
                        label: Text('$sport'),
                        visualDensity: VisualDensity.compact,
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 13),
              Row(
                children: [
                  Text(
                    'From ${money(venue['from_price'])}',
                    style: const TextStyle(
                      color: PllayzColors.ink,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const Spacer(),
                  const Icon(
                    Icons.arrow_forward_rounded,
                    color: PllayzColors.green,
                  ),
                ],
              ),
            ],
          ),
        );
        if (horizontal) {
          return Row(
            children: [
              SizedBox(width: 230, child: photo),
              Expanded(child: details),
            ],
          );
        }
        return Column(children: [photo, details]);
      },
    ),
  );
}

void _openVenue(BuildContext context, Json venue, CatalogBundle bundle) {
  Navigator.of(context).push(
    MaterialPageRoute(
      builder: (_) => VenueDetailPage(venue: venue, bundle: bundle),
    ),
  );
}

class VenueDetailPage extends StatefulWidget {
  const VenueDetailPage({required this.venue, required this.bundle, super.key});
  final Json venue;
  final CatalogBundle bundle;

  @override
  State<VenueDetailPage> createState() => _VenueDetailPageState();
}

class _VenueDetailPageState extends State<VenueDetailPage> {
  bool _busy = false;

  Future<void> _hold(Json slot) async {
    setState(() => _busy = true);
    try {
      await _repo.createHold('${slot['id']}');
      if (!mounted) return;
      showDialog<void>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          icon: const Icon(
            Icons.timer_outlined,
            color: PllayzColors.green,
            size: 34,
          ),
          title: const Text('Slot held for you'),
          content: const Text(
            'Complete the ₹500 advance from Track bookings before the hold expires.',
            textAlign: TextAlign.center,
          ),
          actions: [
            FilledButton(
              onPressed: () {
                Navigator.pop(dialogContext);
                Navigator.pop(context);
              },
              child: const Text('Go to bookings'),
            ),
          ],
        ),
      );
    } catch (error) {
      if (mounted) showMessage(context, '$error', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final venue = widget.venue;
    final courts = widget.bundle.courts
        .where((court) => court['venue_id'] == venue['id'])
        .toList();
    final sportById = {
      for (final sport in widget.bundle.sports) sport['id']: sport,
    };
    return Scaffold(
      appBar: AppBar(
        title: Text('${venue['name']}'),
        backgroundColor: PllayzColors.canvas,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 36),
          children: [
            VenuePhoto(venue['image_url'], height: 230),
            const SizedBox(height: 20),
            Text(
              '${venue['name']}',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 6),
            Text('${venue['area']}, ${venue['city']}'),
            const SizedBox(height: 14),
            Text('${venue['description']}'),
            const SizedBox(height: 20),
            const SectionTitle('Available slots'),
            ...courts.map((court) {
              final supported = widget.bundle.courtSports
                  .where((row) => row['court_id'] == court['id'])
                  .map((row) => sportById[row['sport_id']])
                  .whereType<Json>()
                  .toList();
              final slots = widget.bundle.slots
                  .where((slot) => slot['court_id'] == court['id'])
                  .take(24)
                  .toList();
              return Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: PllayzCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${court['name']}',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${court['court_type']} • ${supported.map((e) => e['name']).join(', ')}',
                      ),
                      const SizedBox(height: 14),
                      if (slots.isEmpty)
                        const Text('No open slots in the next 14 days.')
                      else
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: slots
                              .map(
                                (slot) => ActionChip(
                                  avatar: const Icon(
                                    Icons.schedule_rounded,
                                    size: 17,
                                  ),
                                  label: Text(
                                    '${dateTimeLabel(slot['start_time'])}\n'
                                    '${money(slot['price_total'])}',
                                  ),
                                  onPressed: _busy ? null : () => _hold(slot),
                                ),
                              )
                              .toList(),
                        ),
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

class PlayerBookingsPage extends StatefulWidget {
  const PlayerBookingsPage({super.key});

  @override
  State<PlayerBookingsPage> createState() => _PlayerBookingsPageState();
}

class _PlayerBookingsPageState extends ReloadableState<PlayerBookingsPage> {
  late Future<BookingBundle> _future;
  late final Razorpay _razorpay;
  Json? _activeOrder;
  bool _busy = false;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _future = _repo.bookingActivity();
    _razorpay = Razorpay()
      ..on(Razorpay.EVENT_PAYMENT_SUCCESS, _paymentSuccess)
      ..on(Razorpay.EVENT_PAYMENT_ERROR, _paymentError)
      ..on(Razorpay.EVENT_EXTERNAL_WALLET, _externalWallet);
  }

  @override
  void dispose() {
    _poll?.cancel();
    _razorpay.clear();
    super.dispose();
  }

  @override
  Future<void> reload() async =>
      setState(() => _future = _repo.bookingActivity());

  Future<void> _startPayment(Json hold) async {
    setState(() => _busy = true);
    try {
      final data = await _repo.createPaymentOrder('${hold['id']}');
      final order = jsonRow(data['order']);
      if (order == null) throw StateError('Razorpay order was not returned.');
      _activeOrder = data;
      final user = Supabase.instance.client.auth.currentUser;
      _razorpay.open({
        'key': data['key_id'],
        'order_id': order['id'],
        'amount': order['amount'],
        'currency': order['currency'] ?? 'INR',
        'name': 'Pllayz',
        'description': '₹500 venue booking advance',
        'prefill': {'email': user?.email ?? '', 'contact': user?.phone ?? ''},
        'theme': {'color': '#00A86B'},
      });
    } catch (error) {
      if (mounted) showMessage(context, '$error', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _paymentSuccess(PaymentSuccessResponse response) async {
    final paymentId = response.paymentId;
    final orderId = response.orderId;
    final signature = response.signature;
    if (paymentId == null || orderId == null || signature == null) {
      if (mounted) {
        showMessage(context, 'Payment response was incomplete.', error: true);
      }
      return;
    }
    setState(() => _busy = true);
    try {
      await _repo.verifyPaymentReturn(
        orderId: orderId,
        paymentId: paymentId,
        signature: signature,
      );
      if (mounted) {
        showMessage(
          context,
          'Payment received. Confirming securely with Razorpay…',
        );
      }
      var attempts = 0;
      _poll?.cancel();
      _poll = Timer.periodic(const Duration(seconds: 2), (timer) async {
        attempts++;
        await reload();
        if (attempts >= 8) timer.cancel();
      });
    } catch (error) {
      if (mounted) showMessage(context, '$error', error: true);
    } finally {
      _activeOrder = null;
      if (mounted) setState(() => _busy = false);
    }
  }

  void _paymentError(PaymentFailureResponse response) {
    _activeOrder = null;
    if (mounted) {
      showMessage(
        context,
        response.message ?? 'Payment was not completed.',
        error: true,
      );
      reload();
    }
  }

  void _externalWallet(ExternalWalletResponse response) {
    if (mounted) {
      showMessage(context, 'Continue in ${response.walletName ?? 'wallet'}.');
    }
  }

  Future<void> _cancelHold(Json hold) async {
    setState(() => _busy = true);
    try {
      await _repo.cancelHold('${hold['id']}');
      await reload();
    } catch (error) {
      if (mounted) showMessage(context, '$error', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _publish(Json booking) async {
    final values = await _teamDialog(
      context,
      title: 'Publish opponent request',
      includeSkill: true,
    );
    if (values == null) return;
    setState(() => _busy = true);
    try {
      await _repo.createMatchPost(
        bookingId: '${booking['id']}',
        teamName: values.$1,
        skill: values.$2,
        note: values.$3,
      );
      await reload();
      if (mounted) showMessage(context, 'Your opponent request is live.');
    } catch (error) {
      if (mounted) showMessage(context, '$error', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _cancelPost(Json post) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Close opponent request?'),
        content: const Text(
          'This removes the match from the public opponent finder.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep it live'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Close request'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _busy = true);
    try {
      await _repo.cancelMatchPost('${post['id']}');
      await reload();
      if (mounted) showMessage(context, 'Opponent request closed.');
    } catch (error) {
      if (mounted) showMessage(context, '$error', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => PageFrame(
    title: 'Track bookings',
    subtitle: 'Holds, secure payments and confirmed games in one place.',
    child: FutureBuilder<BookingBundle>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return _LoadError(error: snapshot.error, retry: reload);
        }
        if (!snapshot.hasData) return const _LoadingCards();
        final data = snapshot.data!;
        final activeHolds = data.holds
            .where((hold) => hold['status'] == 'payment_pending')
            .toList();
        final postByBooking = {
          for (final post in data.posts) post['booking_id']: post,
        };
        if (data.holds.isEmpty && data.bookings.isEmpty) {
          return const EmptyState(
            icon: Icons.calendar_month_outlined,
            title: 'No booking activity yet',
            message: 'Reserve a slot from Venues to start.',
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_activeOrder != null) ...[
              const PllayzCard(
                color: PllayzColors.mint,
                child: Row(
                  children: [
                    CircularProgressIndicator(strokeWidth: 2),
                    SizedBox(width: 14),
                    Expanded(
                      child: Text(
                        'Razorpay checkout is open. Your booking is confirmed only after the signed webhook is received.',
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
            const SectionTitle('Active holds'),
            if (activeHolds.isEmpty)
              const Text('No slot is waiting for payment.')
            else
              ...activeHolds.map(
                (hold) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _HoldCard(
                    hold: hold,
                    payment: data.payments
                        .where((p) => p['booking_hold_id'] == hold['id'])
                        .firstOrNull,
                    busy: _busy,
                    onPay: () => _startPayment(hold),
                    onCancel: () => _cancelHold(hold),
                  ),
                ),
              ),
            const SizedBox(height: 18),
            const SectionTitle('Confirmed games'),
            if (data.bookings.isEmpty)
              const Text('Completed payments will appear here.')
            else
              ...data.bookings.map(
                (booking) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _BookingCard(
                    booking: booking,
                    post: postByBooking[booking['id']],
                    onPublish:
                        DateTime.tryParse(
                                  '${booking['snapshot_start_time']}',
                                )?.isAfter(DateTime.now()) ==
                                true &&
                            postByBooking[booking['id']] == null
                        ? () => _publish(booking)
                        : null,
                    onCancelPost:
                        postByBooking[booking['id']] != null &&
                            ['open', 'matched'].contains(
                              '${postByBooking[booking['id']]?['status']}',
                            )
                        ? () => _cancelPost(postByBooking[booking['id']]!)
                        : null,
                  ),
                ),
              ),
            const SizedBox(height: 18),
            const SectionTitle('Payment history'),
            ...data.payments.map(
              (payment) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: PllayzCard(
                  child: Row(
                    children: [
                      const Icon(
                        Icons.account_balance_wallet_outlined,
                        color: PllayzColors.green,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              money(
                                (payment['amount_subunits'] as num? ?? 0) / 100,
                              ),
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            Text(shortDate(payment['created_at'])),
                          ],
                        ),
                      ),
                      StatusPill('${payment['status']}'),
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    ),
  );
}

class _HoldCard extends StatelessWidget {
  const _HoldCard({
    required this.hold,
    required this.payment,
    required this.busy,
    required this.onPay,
    required this.onCancel,
  });
  final Json hold;
  final Json? payment;
  final bool busy;
  final VoidCallback onPay;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final paymentStarted =
        payment != null &&
        !['failed', 'expired'].contains('${payment!['status']}');
    return PllayzCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  '${hold['snapshot_venue_name']}',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
              const StatusPill('payment pending'),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${hold['snapshot_sport_name']} • ${hold['snapshot_court_name']}',
          ),
          const SizedBox(height: 5),
          Text(dateTimeLabel(hold['snapshot_start_time'])),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: PllayzColors.mint,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.timer_outlined, color: PllayzColors.green),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Hold expires ${dateTimeLabel(hold['expires_at'])}',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: FilledButton(
                  onPressed: busy ? null : onPay,
                  child: Text(
                    paymentStarted
                        ? 'Resume secure payment'
                        : 'Pay ₹500 advance',
                  ),
                ),
              ),
              const SizedBox(width: 10),
              IconButton.outlined(
                onPressed: busy || paymentStarted ? null : onCancel,
                tooltip: paymentStarted
                    ? 'Payment order already created'
                    : 'Release hold',
                icon: const Icon(Icons.close_rounded),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  const _BookingCard({
    required this.booking,
    this.post,
    this.onPublish,
    this.onCancelPost,
  });
  final Json booking;
  final Json? post;
  final VoidCallback? onPublish;
  final VoidCallback? onCancelPost;

  @override
  Widget build(BuildContext context) => PllayzCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                '${booking['snapshot_venue_name']}',
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ),
            StatusPill('${booking['status']}'),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          '${booking['snapshot_sport_name']} • '
          '${booking['snapshot_court_name']}',
        ),
        const SizedBox(height: 4),
        Text(dateTimeLabel(booking['snapshot_start_time'])),
        const SizedBox(height: 10),
        Row(
          children: [
            Text(
              '${money(booking['snapshot_total_amount'])} total',
              style: const TextStyle(
                color: PllayzColors.ink,
                fontWeight: FontWeight.w700,
              ),
            ),
            const Spacer(),
            if (post != null) StatusPill('${post!['status']} opponent post'),
          ],
        ),
        if (onPublish != null) ...[
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: onPublish,
              icon: const Icon(Icons.groups_2_rounded),
              label: const Text('Find an opponent for this game'),
            ),
          ),
        ],
        if (onCancelPost != null) ...[
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: TextButton.icon(
              onPressed: onCancelPost,
              icon: const Icon(Icons.close_rounded),
              label: const Text('Close opponent request'),
            ),
          ),
        ],
      ],
    ),
  );
}

class OpponentFinderPage extends StatefulWidget {
  const OpponentFinderPage({super.key});

  @override
  State<OpponentFinderPage> createState() => _OpponentFinderPageState();
}

class _OpponentFinderPageState extends ReloadableState<OpponentFinderPage> {
  late Future<List<Json>> _future;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = _repo.matchmakingFeed();
  }

  @override
  Future<void> reload() async =>
      setState(() => _future = _repo.matchmakingFeed());

  Future<void> _join(Json post) async {
    final values = await _teamDialog(
      context,
      title: 'Join this match',
      includeSkill: false,
    );
    if (values == null) return;
    setState(() => _busy = true);
    try {
      await _repo.joinMatchPost(
        postId: '${post['id']}',
        teamName: values.$1,
        note: values.$3,
      );
      await reload();
      if (mounted) showMessage(context, 'Teams matched. Game on!');
    } catch (error) {
      if (mounted) showMessage(context, '$error', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => PageFrame(
    title: 'Find opponents',
    subtitle: 'Join a team that already has the venue booked.',
    child: FutureBuilder<List<Json>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return _LoadError(error: snapshot.error, retry: reload);
        }
        if (!snapshot.hasData) return const _LoadingCards();
        final posts = snapshot.data!;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            PllayzCard(
              color: PllayzColors.mint,
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline_rounded, color: PllayzColors.green),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'The host has already paid the venue advance. The opponent joins the match without paying again.',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            if (posts.isEmpty)
              const EmptyState(
                icon: Icons.groups_2_outlined,
                title: 'No open team requests yet',
                message:
                    'Book a future slot, complete payment, then publish it from Track bookings. Every player will see it here.',
              )
            else
              ...posts.map(
                (post) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _OpponentCard(
                    post: post,
                    busy: _busy,
                    onJoin: () => _join(post),
                    onShare: () => SharePlus.instance.share(
                      ShareParams(
                        text:
                            '${post['host_team_name']} needs an opponent for '
                            '${post['snapshot_sport_name']} at '
                            '${post['snapshot_venue_name']} on '
                            '${dateTimeLabel(post['snapshot_start_time'])}. '
                            'Join on Pllayz: $webBaseUrl/app/player/opponents',
                      ),
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    ),
  );
}

class _OpponentCard extends StatelessWidget {
  const _OpponentCard({
    required this.post,
    required this.busy,
    required this.onJoin,
    required this.onShare,
  });
  final Json post;
  final bool busy;
  final VoidCallback onJoin;
  final VoidCallback onShare;

  @override
  Widget build(BuildContext context) => PllayzCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                color: PllayzColors.mint,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.sports_cricket_rounded,
                color: PllayzColors.green,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${post['host_team_name']}',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  Text('${post['skill_level'] ?? 'All skill levels'}'),
                ],
              ),
            ),
            const StatusPill('open'),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          '${post['snapshot_sport_name']} • ${post['snapshot_court_name']}',
          style: const TextStyle(
            color: PllayzColors.ink,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 5),
        Text('${post['snapshot_venue_name']}, ${post['snapshot_venue_area']}'),
        const SizedBox(height: 5),
        Text(dateTimeLabel(post['snapshot_start_time'])),
        if ('${post['host_note'] ?? ''}'.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text('“${post['host_note']}”'),
        ],
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: FilledButton.icon(
                onPressed: busy ? null : onJoin,
                icon: const Icon(Icons.handshake_outlined),
                label: const Text('Join match'),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.outlined(
              onPressed: onShare,
              icon: const Icon(Icons.ios_share_rounded),
              tooltip: 'Share',
            ),
          ],
        ),
      ],
    ),
  );
}

Future<(String, String?, String?)?> _teamDialog(
  BuildContext context, {
  required String title,
  required bool includeSkill,
}) async {
  final team = TextEditingController();
  final note = TextEditingController();
  String skill = 'Recreational';
  return showDialog<(String, String?, String?)>(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: Text(title),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: team,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(labelText: 'Team name'),
              ),
              if (includeSkill) ...[
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: skill,
                  decoration: const InputDecoration(labelText: 'Skill level'),
                  items: const ['Recreational', 'Intermediate', 'Competitive']
                      .map(
                        (value) =>
                            DropdownMenuItem(value: value, child: Text(value)),
                      )
                      .toList(),
                  onChanged: (value) => setState(() => skill = value ?? skill),
                ),
              ],
              const SizedBox(height: 12),
              TextField(
                controller: note,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Note (optional)',
                  hintText: 'Timing, format or contact instructions',
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              if (team.text.trim().length < 2) return;
              Navigator.pop(context, (
                team.text.trim(),
                includeSkill ? skill : null,
                note.text.trim().isEmpty ? null : note.text.trim(),
              ));
            },
            child: Text(includeSkill ? 'Publish' : 'Join'),
          ),
        ],
      ),
    ),
  );
}

class _LoadingCards extends StatelessWidget {
  const _LoadingCards();

  @override
  Widget build(BuildContext context) => Column(
    children: List.generate(
      3,
      (index) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child:
            Container(
                  height: 150,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                  ),
                )
                .animate(onPlay: (controller) => controller.repeat())
                .shimmer(duration: 1100.ms, color: PllayzColors.mint),
      ),
    ),
  );
}

class _LoadError extends StatelessWidget {
  const _LoadError({required this.error, required this.retry});
  final Object? error;
  final VoidCallback retry;

  @override
  Widget build(BuildContext context) => EmptyState(
    icon: Icons.cloud_off_rounded,
    title: 'Could not load this section',
    message: '$error',
    action: FilledButton.icon(
      onPressed: retry,
      icon: const Icon(Icons.refresh_rounded),
      label: const Text('Try again'),
    ),
  );
}
