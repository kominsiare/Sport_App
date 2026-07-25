import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../data/pllayz_repository.dart';
import '../../ui/app_theme.dart';
import '../../ui/common.dart';

PllayzRepository get _repo => PllayzRepository(Supabase.instance.client);

class OwnerDashboardPage extends StatefulWidget {
  const OwnerDashboardPage({super.key});

  @override
  State<OwnerDashboardPage> createState() => _OwnerDashboardPageState();
}

class _OwnerDashboardPageState extends ReloadableState<OwnerDashboardPage> {
  late Future<OwnerBundle> _future;

  @override
  void initState() {
    super.initState();
    _future = _repo.ownerDashboard();
  }

  @override
  Future<void> reload() async =>
      setState(() => _future = _repo.ownerDashboard());

  @override
  Widget build(BuildContext context) => PageFrame(
    title: 'Owner dashboard',
    subtitle: 'A clear view of venues, bookings and collections.',
    child: FutureBuilder<OwnerBundle>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return _OwnerLoadError(snapshot.error, reload);
        }
        if (!snapshot.hasData) return const _OwnerLoading();
        final data = snapshot.data!;
        final available = data.slots
            .where((s) => s['status'] == 'available')
            .length;
        final pending = data.venues.where((venue) {
          final approval = data.approvals
              .where((a) => a['venue_id'] == venue['id'])
              .firstOrNull;
          return venue['status'] == 'pending_review' ||
              approval?['decision'] == 'pending';
        }).length;
        final commission = data.commissions.fold<num>(
          0,
          (sum, row) => sum + (row['collected_from_advance'] as num? ?? 0),
        );
        final ownerDue = data.commissions.fold<num>(
          0,
          (sum, row) => sum + (row['owner_due_amount'] as num? ?? 0),
        );
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LayoutBuilder(
              builder: (context, constraints) {
                final width = constraints.maxWidth;
                final count = width >= 900
                    ? 4
                    : width >= 520
                    ? 2
                    : 2;
                return GridView.count(
                  crossAxisCount: count,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: width < 400 ? 1.03 : 1.3,
                  children: [
                    MetricTile(
                      label: 'Owned venues',
                      value: '${data.venues.length}',
                      icon: Icons.storefront_rounded,
                    ),
                    MetricTile(
                      label: 'Available slots',
                      value: '$available',
                      icon: Icons.event_available_rounded,
                    ),
                    MetricTile(
                      label: 'Confirmed games',
                      value:
                          '${data.bookings.where((b) => b['status'] == 'confirmed').length}',
                      icon: Icons.check_circle_outline_rounded,
                    ),
                    MetricTile(
                      label: 'Pending review',
                      value: '$pending',
                      icon: Icons.hourglass_top_rounded,
                      tint: PllayzColors.amber,
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 22),
            const SectionTitle('Money snapshot'),
            Row(
              children: [
                Expanded(
                  child: PllayzCard(
                    color: PllayzColors.mint,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Pllayz commission'),
                        const SizedBox(height: 8),
                        Text(
                          money(commission),
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: PllayzCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Owner due'),
                        const SizedBox(height: 8),
                        Text(
                          money(ownerDue),
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 22),
            const SectionTitle('Recent bookings'),
            if (data.bookings.isEmpty)
              const EmptyState(
                icon: Icons.receipt_long_outlined,
                title: 'No confirmed bookings',
                message: 'Paid games at your venues appear here.',
              )
            else
              ...data.bookings
                  .take(5)
                  .map(
                    (booking) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _ActivityCard(
                        icon: Icons.sports_cricket_rounded,
                        title: '${booking['snapshot_venue_name']}',
                        subtitle:
                            '${booking['snapshot_sport_name']} • ${dateTimeLabel(booking['snapshot_start_time'])}',
                        trailing: StatusPill('${booking['status']}'),
                      ),
                    ),
                  ),
          ],
        );
      },
    ),
  );
}

class OwnerVenuesPage extends StatefulWidget {
  const OwnerVenuesPage({super.key});

  @override
  State<OwnerVenuesPage> createState() => _OwnerVenuesPageState();
}

class _OwnerVenuesPageState extends ReloadableState<OwnerVenuesPage> {
  late Future<OwnerBundle> _future;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = _repo.ownerDashboard();
  }

  @override
  Future<void> reload() async =>
      setState(() => _future = _repo.ownerDashboard());

  Future<void> _save({Json? venue, Json? image}) async {
    final draft = await showDialog<_VenueDraft>(
      context: context,
      builder: (_) => _VenueDialog(venue: venue, image: image),
    );
    if (draft == null) return;
    setState(() => _busy = true);
    try {
      await _repo.saveVenue(
        id: venue?['id'] as String?,
        name: draft.name,
        city: draft.city,
        area: draft.area,
        address: draft.address,
        latitude: draft.latitude,
        longitude: draft.longitude,
        description: draft.description,
        amenities: draft.amenities,
        imageUrl: draft.imageUrl,
      );
      await reload();
      if (mounted) showMessage(context, 'Venue saved.');
    } catch (error) {
      if (mounted) showMessage(context, '$error', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _delete(Json venue) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete draft venue?'),
        content: Text(
          '“${venue['name']}” and its draft setup will be permanently removed.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep venue'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: PllayzColors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _busy = true);
    try {
      await _repo.deleteVenue('${venue['id']}');
      await reload();
    } catch (error) {
      if (mounted) showMessage(context, '$error', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => PageFrame(
    title: 'Your venues',
    subtitle: 'Create, publish and operate every court from your phone.',
    actions: [
      IconButton.filled(
        onPressed: _busy ? null : () => _save(),
        tooltip: 'New venue',
        icon: const Icon(Icons.add_rounded),
      ),
    ],
    child: FutureBuilder<OwnerBundle>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return _OwnerLoadError(snapshot.error, reload);
        }
        if (!snapshot.hasData) return const _OwnerLoading();
        final data = snapshot.data!;
        if (data.venues.isEmpty) {
          return EmptyState(
            icon: Icons.storefront_outlined,
            title: 'Create your first venue',
            message:
                'Start with its address and image, then add courts and weekly slots.',
            action: FilledButton.icon(
              onPressed: () => _save(),
              icon: const Icon(Icons.add_rounded),
              label: const Text('New venue'),
            ),
          );
        }
        return Column(
          children: data.venues.map((venue) {
            final image = data.images
                .where((row) => row['venue_id'] == venue['id'])
                .firstOrNull;
            final approval = data.approvals
                .where((row) => row['venue_id'] == venue['id'])
                .firstOrNull;
            final courts = data.courts
                .where((row) => row['venue_id'] == venue['id'])
                .toList();
            final courtIds = courts.map((e) => e['id']).toSet();
            final slots = data.slots
                .where((row) => courtIds.contains(row['court_id']))
                .toList();
            return Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: PllayzCard(
                padding: const EdgeInsets.all(10),
                child: Column(
                  children: [
                    VenuePhoto(image?['public_url'], height: 170),
                    Padding(
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
                              StatusPill(
                                '${approval?['decision'] ?? venue['status']}',
                              ),
                            ],
                          ),
                          const SizedBox(height: 7),
                          Text('${venue['area']}, ${venue['city']}'),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              Chip(label: Text('${courts.length} courts')),
                              Chip(
                                label: Text(
                                  '${slots.where((s) => s['status'] == 'available').length} open slots',
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: _busy
                                      ? null
                                      : () => _save(venue: venue, image: image),
                                  icon: const Icon(Icons.edit_outlined),
                                  label: const Text('Edit'),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: FilledButton.icon(
                                  onPressed: () async {
                                    await Navigator.push<void>(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) =>
                                            OwnerVenueOperationsPage(
                                              venueId: '${venue['id']}',
                                            ),
                                      ),
                                    );
                                    await reload();
                                  },
                                  icon: const Icon(
                                    Icons.calendar_month_rounded,
                                  ),
                                  label: const Text('Operate'),
                                ),
                              ),
                              if (venue['status'] == 'draft') ...[
                                const SizedBox(width: 8),
                                IconButton.outlined(
                                  onPressed: _busy
                                      ? null
                                      : () => _delete(venue),
                                  icon: const Icon(Icons.delete_outline),
                                  tooltip: 'Delete draft',
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        );
      },
    ),
  );
}

class OwnerVenueOperationsPage extends StatefulWidget {
  const OwnerVenueOperationsPage({required this.venueId, super.key});
  final String venueId;

  @override
  State<OwnerVenueOperationsPage> createState() =>
      _OwnerVenueOperationsPageState();
}

class _OwnerVenueOperationsPageState
    extends ReloadableState<OwnerVenueOperationsPage> {
  late Future<OwnerBundle> _future;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = _repo.ownerDashboard();
  }

  @override
  Future<void> reload() async =>
      setState(() => _future = _repo.ownerDashboard());

  Future<void> _action(Future<void> Function() action, String success) async {
    setState(() => _busy = true);
    try {
      await action();
      await reload();
      if (mounted) showMessage(context, success);
    } catch (error) {
      if (mounted) showMessage(context, '$error', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _saveCourt(OwnerBundle data, {Json? court}) async {
    final value = await showDialog<_CourtDraft>(
      context: context,
      builder: (_) => _CourtDialog(data: data, court: court),
    );
    if (value == null) return;
    await _action(() async {
      await _repo.saveCourt(
        id: court?['id'] as String?,
        venueId: widget.venueId,
        name: value.name,
        type: value.type,
        duration: value.duration,
        price: value.price,
        sportIds: value.sports,
      );
    }, 'Court setup saved.');
  }

  Future<void> _addRule(OwnerBundle data, Json court) async {
    final value = await showDialog<_RuleDraft>(
      context: context,
      builder: (_) => _RuleDialog(data: data, court: court),
    );
    if (value == null) return;
    await _action(
      () => _repo.saveRule(
        courtId: '${court['id']}',
        sportId: value.sportId,
        weekday: value.weekday,
        opens: value.opens,
        closes: value.closes,
        duration: value.duration,
        price: value.price,
      ),
      'Weekly availability added.',
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Venue operations'),
      backgroundColor: PllayzColors.canvas,
    ),
    body: SafeArea(
      child: FutureBuilder<OwnerBundle>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return ListView(
              padding: const EdgeInsets.all(20),
              children: [_OwnerLoadError(snapshot.error, reload)],
            );
          }
          if (!snapshot.hasData) {
            return const Padding(
              padding: EdgeInsets.all(20),
              child: _OwnerLoading(),
            );
          }
          final data = snapshot.data!;
          final venue = data.venues
              .where((v) => v['id'] == widget.venueId)
              .firstOrNull;
          if (venue == null) {
            return const Center(child: Text('Venue not found.'));
          }
          final courts = data.courts
              .where((c) => c['venue_id'] == widget.venueId)
              .toList();
          final image = data.images
              .where((i) => i['venue_id'] == widget.venueId)
              .firstOrNull;
          final ready =
              image != null &&
              courts.any((c) => c['is_active'] == true) &&
              data.courtSports.any(
                (cs) =>
                    cs['is_active'] == true &&
                    courts.any((c) => c['id'] == cs['court_id']),
              );
          return RefreshIndicator(
            onRefresh: reload,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
              children: [
                Text(
                  '${venue['name']}',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 6),
                Text('${venue['area']}, ${venue['city']}'),
                const SizedBox(height: 16),
                PllayzCard(
                  color: PllayzColors.mint,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Publishing checklist',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 12),
                      _Checklist('Primary image', image != null),
                      _Checklist(
                        'At least one active court',
                        courts.isNotEmpty,
                      ),
                      _Checklist('Supported sport selected', ready),
                      const SizedBox(height: 14),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          FilledButton.icon(
                            onPressed: _busy || !ready
                                ? null
                                : () => _action(
                                    () => _repo.submitVenue(widget.venueId),
                                    'Venue submitted for review.',
                                  ),
                            icon: const Icon(Icons.send_rounded),
                            label: const Text('Submit for review'),
                          ),
                          OutlinedButton.icon(
                            onPressed: _busy
                                ? null
                                : () => _action(
                                    () =>
                                        _repo.refreshVenueSlots(widget.venueId),
                                    'Future slots refreshed.',
                                  ),
                            icon: const Icon(Icons.refresh_rounded),
                            label: const Text('Refresh slots'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 22),
                SectionTitle(
                  'Courts and availability',
                  trailing: IconButton.filled(
                    onPressed: _busy ? null : () => _saveCourt(data),
                    icon: const Icon(Icons.add_rounded),
                    tooltip: 'Add court',
                  ),
                ),
                if (courts.isEmpty)
                  const EmptyState(
                    icon: Icons.stadium_outlined,
                    title: 'Add your first court',
                    message:
                        'Choose supported sports, then add a weekly schedule.',
                  )
                else
                  ...courts.map(
                    (court) => Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: _CourtOperationsCard(
                        data: data,
                        court: court,
                        busy: _busy,
                        onEdit: () => _saveCourt(data, court: court),
                        onRule: () => _addRule(data, court),
                        onToggleRule: (rule, active) => _action(
                          () => _repo.toggleRule('${rule['id']}', active),
                          active ? 'Rule enabled.' : 'Rule paused.',
                        ),
                        onDeleteRule: (rule) => _action(
                          () => _repo.deleteRule('${rule['id']}'),
                          'Rule deleted.',
                        ),
                        onToggleSlot: (slot) {
                          final blocked = slot['status'] == 'blocked';
                          _action(
                            () => _repo.blockSlot(
                              '${slot['id']}',
                              !blocked,
                              reason: 'Blocked from Pllayz mobile',
                            ),
                            blocked ? 'Slot unblocked.' : 'Slot blocked.',
                          );
                        },
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    ),
  );
}

class _CourtOperationsCard extends StatelessWidget {
  const _CourtOperationsCard({
    required this.data,
    required this.court,
    required this.busy,
    required this.onEdit,
    required this.onRule,
    required this.onToggleRule,
    required this.onDeleteRule,
    required this.onToggleSlot,
  });
  final OwnerBundle data;
  final Json court;
  final bool busy;
  final VoidCallback onEdit;
  final VoidCallback onRule;
  final void Function(Json rule, bool active) onToggleRule;
  final ValueChanged<Json> onDeleteRule;
  final ValueChanged<Json> onToggleSlot;

  @override
  Widget build(BuildContext context) {
    final sportsById = {for (final s in data.sports) s['id']: s};
    final courtSports = data.courtSports
        .where((cs) => cs['court_id'] == court['id'])
        .toList();
    final rules = data.rules
        .where((rule) => rule['court_id'] == court['id'])
        .toList();
    final slots = data.slots
        .where((slot) => slot['court_id'] == court['id'])
        .take(20);
    return PllayzCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${court['name']}',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    Text(
                      '${court['court_type']} • from ${money(court['base_price'])}',
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: busy ? null : onEdit,
                icon: const Icon(Icons.edit_outlined),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 7,
            runSpacing: 7,
            children: courtSports
                .where((cs) => cs['is_active'] == true)
                .map(
                  (cs) => Chip(
                    label: Text(
                      '${sportsById[cs['sport_id']]?['name'] ?? 'Sport'}',
                    ),
                  ),
                )
                .toList(),
          ),
          const Divider(height: 30),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Weekly rules',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              TextButton.icon(
                onPressed: busy ? null : onRule,
                icon: const Icon(Icons.add_rounded),
                label: const Text('Add'),
              ),
            ],
          ),
          if (rules.isEmpty)
            const Text('No schedule yet.')
          else
            ...rules.map(
              (rule) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(
                  '${_weekday(rule['weekday'])} • '
                  '${_time(rule['start_local'])}–${_time(rule['end_local'])}',
                ),
                subtitle: Text(
                  '${rule['duration_minutes']} min • ${money(rule['price_total'])}',
                ),
                leading: Switch(
                  value: rule['is_active'] == true,
                  onChanged: busy
                      ? null
                      : (active) => onToggleRule(rule, active),
                ),
                trailing: IconButton(
                  onPressed: busy ? null : () => onDeleteRule(rule),
                  icon: const Icon(Icons.delete_outline_rounded),
                ),
              ),
            ),
          const Divider(height: 30),
          Text(
            'Upcoming slots',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 10),
          if (slots.isEmpty)
            const Text('Refresh slots after adding a weekly rule.')
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: slots
                  .map(
                    (slot) => FilterChip(
                      label: Text(
                        '${dateTimeLabel(slot['start_time'])}\n${slot['status']}',
                      ),
                      selected: slot['status'] == 'blocked',
                      selectedColor: const Color(0xFFFFE7E7),
                      onSelected: busy ? null : (_) => onToggleSlot(slot),
                    ),
                  )
                  .toList(),
            ),
        ],
      ),
    );
  }
}

class OwnerActivityPage extends StatefulWidget {
  const OwnerActivityPage({super.key});

  @override
  State<OwnerActivityPage> createState() => _OwnerActivityPageState();
}

class _OwnerActivityPageState extends ReloadableState<OwnerActivityPage> {
  late Future<OwnerBundle> _future;

  @override
  void initState() {
    super.initState();
    _future = _repo.ownerDashboard();
  }

  @override
  Future<void> reload() async =>
      setState(() => _future = _repo.ownerDashboard());

  @override
  Widget build(BuildContext context) => PageFrame(
    title: 'Activity',
    subtitle: 'Bookings, payment states, commission and owner actions.',
    child: FutureBuilder<OwnerBundle>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return _OwnerLoadError(snapshot.error, reload);
        }
        if (!snapshot.hasData) return const _OwnerLoading();
        final data = snapshot.data!;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SectionTitle('Payments'),
            if (data.payments.isEmpty)
              const Text('No payment activity.')
            else
              ...data.payments
                  .take(20)
                  .map(
                    (row) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _ActivityCard(
                        icon: Icons.payments_outlined,
                        title: money(
                          (row['amount_subunits'] as num? ?? 0) / 100,
                        ),
                        subtitle:
                            '${shortDate(row['created_at'])} • ${row['razorpay_payment_id'] ?? 'Order pending'}',
                        trailing: StatusPill('${row['status']}'),
                      ),
                    ),
                  ),
            const SizedBox(height: 18),
            const SectionTitle('Player payment holds'),
            if (data.holds.isEmpty)
              const Text('No active or historical holds.')
            else
              ...data.holds
                  .take(20)
                  .map(
                    (row) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _ActivityCard(
                        icon: Icons.timer_outlined,
                        title: '${row['snapshot_venue_name']}',
                        subtitle:
                            '${row['snapshot_sport_name']} • ${dateTimeLabel(row['snapshot_start_time'])}',
                        trailing: StatusPill('${row['status']}'),
                      ),
                    ),
                  ),
            const SizedBox(height: 18),
            const SectionTitle('Commission records'),
            if (data.commissions.isEmpty)
              const Text('No commission records.')
            else
              ...data.commissions
                  .take(20)
                  .map(
                    (row) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _ActivityCard(
                        icon: Icons.pie_chart_outline_rounded,
                        title: '${money(row['commission_amount'])} commission',
                        subtitle: '${money(row['owner_due_amount'])} owner due',
                        trailing: StatusPill('${row['collection_status']}'),
                      ),
                    ),
                  ),
            const SizedBox(height: 18),
            const SectionTitle('Operation log'),
            if (data.logs.isEmpty)
              const Text('No owner operations yet.')
            else
              ...data.logs
                  .take(30)
                  .map(
                    (row) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _ActivityCard(
                        icon: Icons.history_rounded,
                        title: '${row['action']}'.replaceAll('_', ' '),
                        subtitle: dateTimeLabel(row['created_at']),
                      ),
                    ),
                  ),
          ],
        );
      },
    ),
  );
}

class _ActivityCard extends StatelessWidget {
  const _ActivityCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.trailing,
  });
  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => PllayzCard(
    child: Row(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: const BoxDecoration(
            color: PllayzColors.mint,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: PllayzColors.green, size: 21),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 3),
              Text(subtitle),
            ],
          ),
        ),
        trailing ?? const SizedBox.shrink(),
      ],
    ),
  );
}

class _VenueDraft {
  const _VenueDraft({
    required this.name,
    required this.city,
    required this.area,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.description,
    required this.amenities,
    required this.imageUrl,
  });
  final String name;
  final String city;
  final String area;
  final String address;
  final double latitude;
  final double longitude;
  final String description;
  final List<String> amenities;
  final String imageUrl;
}

class _VenueDialog extends StatefulWidget {
  const _VenueDialog({this.venue, this.image});
  final Json? venue;
  final Json? image;

  @override
  State<_VenueDialog> createState() => _VenueDialogState();
}

class _VenueDialogState extends State<_VenueDialog> {
  late final TextEditingController name;
  late final TextEditingController area;
  late final TextEditingController address;
  late final TextEditingController latitude;
  late final TextEditingController longitude;
  late final TextEditingController description;
  late final TextEditingController amenities;
  late final TextEditingController image;
  late String city;

  @override
  void initState() {
    super.initState();
    final venue = widget.venue ?? const <String, dynamic>{};
    name = TextEditingController(text: '${venue['name'] ?? ''}');
    area = TextEditingController(text: '${venue['area'] ?? ''}');
    address = TextEditingController(text: '${venue['address'] ?? ''}');
    latitude = TextEditingController(text: '${venue['latitude'] ?? '30.7333'}');
    longitude = TextEditingController(
      text: '${venue['longitude'] ?? '76.7794'}',
    );
    description = TextEditingController(text: '${venue['description'] ?? ''}');
    amenities = TextEditingController(
      text: ((venue['amenities'] as List?) ?? ['Floodlights', 'Parking']).join(
        ', ',
      ),
    );
    image = TextEditingController(
      text:
          '${widget.image?['public_url'] ?? '$webBaseUrl/assets/night-match-hero.png'}',
    );
    city = '${venue['city'] ?? 'Chandigarh'}';
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text(widget.venue == null ? 'New venue' : 'Edit venue'),
    content: SizedBox(
      width: 520,
      child: SingleChildScrollView(
        child: Column(
          children: [
            _Field(name, 'Venue name'),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              initialValue: city,
              decoration: const InputDecoration(labelText: 'City'),
              items: const [
                'Chandigarh',
                'Mohali',
                'Panchkula',
              ].map((v) => DropdownMenuItem(value: v, child: Text(v))).toList(),
              onChanged: (value) => city = value ?? city,
            ),
            const SizedBox(height: 10),
            _Field(area, 'Area'),
            const SizedBox(height: 10),
            _Field(address, 'Full address'),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _Field(
                    latitude,
                    'Latitude',
                    type: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _Field(
                    longitude,
                    'Longitude',
                    type: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            _Field(description, 'Description', lines: 3),
            const SizedBox(height: 10),
            _Field(amenities, 'Amenities, comma separated'),
            const SizedBox(height: 10),
            _Field(image, 'HTTPS image URL'),
          ],
        ),
      ),
    ),
    actions: [
      TextButton(
        onPressed: () => Navigator.pop(context),
        child: const Text('Cancel'),
      ),
      FilledButton(
        onPressed: () {
          final lat = double.tryParse(latitude.text);
          final lng = double.tryParse(longitude.text);
          if (name.text.trim().length < 3 ||
              area.text.trim().length < 2 ||
              address.text.trim().length < 5 ||
              description.text.trim().length < 20 ||
              lat == null ||
              lng == null ||
              !image.text.trim().startsWith('https://')) {
            showMessage(
              context,
              'Complete every field. Description needs 20+ characters and the image must use HTTPS.',
              error: true,
            );
            return;
          }
          Navigator.pop(
            context,
            _VenueDraft(
              name: name.text.trim(),
              city: city,
              area: area.text.trim(),
              address: address.text.trim(),
              latitude: lat,
              longitude: lng,
              description: description.text.trim(),
              amenities: amenities.text
                  .split(',')
                  .map((e) => e.trim())
                  .where((e) => e.isNotEmpty)
                  .toSet()
                  .toList(),
              imageUrl: image.text.trim(),
            ),
          );
        },
        child: const Text('Save'),
      ),
    ],
  );
}

class _CourtDraft {
  const _CourtDraft(
    this.name,
    this.type,
    this.duration,
    this.price,
    this.sports,
  );
  final String name;
  final String type;
  final int duration;
  final num price;
  final List<String> sports;
}

class _CourtDialog extends StatefulWidget {
  const _CourtDialog({required this.data, this.court});
  final OwnerBundle data;
  final Json? court;

  @override
  State<_CourtDialog> createState() => _CourtDialogState();
}

class _CourtDialogState extends State<_CourtDialog> {
  late final TextEditingController name;
  late final TextEditingController type;
  late final TextEditingController duration;
  late final TextEditingController price;
  late final Set<String> selected;

  @override
  void initState() {
    super.initState();
    final court = widget.court ?? const <String, dynamic>{};
    name = TextEditingController(text: '${court['name'] ?? ''}');
    type = TextEditingController(text: '${court['court_type'] ?? 'Turf'}');
    duration = TextEditingController(
      text: '${court['default_duration_minutes'] ?? 60}',
    );
    price = TextEditingController(text: '${court['base_price'] ?? 1200}');
    selected = widget.data.courtSports
        .where(
          (row) => row['court_id'] == court['id'] && row['is_active'] == true,
        )
        .map((row) => '${row['sport_id']}')
        .toSet();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text(widget.court == null ? 'Add court' : 'Edit court'),
    content: SizedBox(
      width: 500,
      child: SingleChildScrollView(
        child: Column(
          children: [
            _Field(name, 'Court name'),
            const SizedBox(height: 10),
            _Field(type, 'Court type'),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _Field(
                    duration,
                    'Minutes',
                    type: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _Field(
                    price,
                    'Starting price',
                    type: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Supported sports',
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            const SizedBox(height: 6),
            ...widget.data.sports.map(
              (sport) => CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                title: Text('${sport['name']}'),
                value: selected.contains('${sport['id']}'),
                onChanged: (checked) => setState(() {
                  if (checked == true) {
                    selected.add('${sport['id']}');
                  } else {
                    selected.remove('${sport['id']}');
                  }
                }),
              ),
            ),
          ],
        ),
      ),
    ),
    actions: [
      TextButton(
        onPressed: () => Navigator.pop(context),
        child: const Text('Cancel'),
      ),
      FilledButton(
        onPressed: () {
          final minutes = int.tryParse(duration.text);
          final amount = num.tryParse(price.text);
          if (name.text.trim().length < 2 ||
              type.text.trim().length < 2 ||
              minutes == null ||
              minutes < 15 ||
              amount == null ||
              selected.isEmpty) {
            showMessage(
              context,
              'Complete the court and select at least one sport.',
              error: true,
            );
            return;
          }
          Navigator.pop(
            context,
            _CourtDraft(
              name.text.trim(),
              type.text.trim(),
              minutes,
              amount,
              selected.toList(),
            ),
          );
        },
        child: const Text('Save'),
      ),
    ],
  );
}

class _RuleDraft {
  const _RuleDraft(
    this.sportId,
    this.weekday,
    this.opens,
    this.closes,
    this.duration,
    this.price,
  );
  final String sportId;
  final int weekday;
  final String opens;
  final String closes;
  final int duration;
  final num price;
}

class _RuleDialog extends StatefulWidget {
  const _RuleDialog({required this.data, required this.court});
  final OwnerBundle data;
  final Json court;

  @override
  State<_RuleDialog> createState() => _RuleDialogState();
}

class _RuleDialogState extends State<_RuleDialog> {
  late final List<Json> supported;
  late String sportId;
  int weekday = 1;
  final opens = TextEditingController(text: '06:00');
  final closes = TextEditingController(text: '23:00');
  final duration = TextEditingController(text: '60');
  final price = TextEditingController(text: '1200');

  @override
  void initState() {
    super.initState();
    final ids = widget.data.courtSports
        .where(
          (row) =>
              row['court_id'] == widget.court['id'] && row['is_active'] == true,
        )
        .map((row) => row['sport_id'])
        .toSet();
    supported = widget.data.sports.where((s) => ids.contains(s['id'])).toList();
    sportId = supported.isEmpty ? '' : '${supported.first['id']}';
    duration.text = '${widget.court['default_duration_minutes'] ?? 60}';
    price.text = '${widget.court['base_price'] ?? 1200}';
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('Add weekly availability'),
    content: SizedBox(
      width: 480,
      child: SingleChildScrollView(
        child: Column(
          children: [
            DropdownButtonFormField<String>(
              initialValue: sportId.isEmpty ? null : sportId,
              decoration: const InputDecoration(labelText: 'Sport'),
              items: supported
                  .map(
                    (s) => DropdownMenuItem(
                      value: '${s['id']}',
                      child: Text('${s['name']}'),
                    ),
                  )
                  .toList(),
              onChanged: (value) => sportId = value ?? sportId,
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<int>(
              initialValue: weekday,
              decoration: const InputDecoration(labelText: 'Weekday'),
              items: List.generate(
                7,
                (index) => DropdownMenuItem(
                  value: index,
                  child: Text(_weekday(index)),
                ),
              ),
              onChanged: (value) => weekday = value ?? weekday,
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(child: _Field(opens, 'Opens (HH:mm)')),
                const SizedBox(width: 10),
                Expanded(child: _Field(closes, 'Closes (HH:mm)')),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _Field(
                    duration,
                    'Slot minutes',
                    type: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _Field(
                    price,
                    'Slot price',
                    type: TextInputType.number,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ),
    actions: [
      TextButton(
        onPressed: () => Navigator.pop(context),
        child: const Text('Cancel'),
      ),
      FilledButton(
        onPressed: () {
          final minutes = int.tryParse(duration.text);
          final amount = num.tryParse(price.text);
          if (sportId.isEmpty ||
              minutes == null ||
              minutes < 15 ||
              amount == null ||
              !RegExp(r'^\d\d:\d\d$').hasMatch(opens.text) ||
              !RegExp(r'^\d\d:\d\d$').hasMatch(closes.text)) {
            showMessage(context, 'Enter a valid schedule.', error: true);
            return;
          }
          Navigator.pop(
            context,
            _RuleDraft(
              sportId,
              weekday,
              opens.text,
              closes.text,
              minutes,
              amount,
            ),
          );
        },
        child: const Text('Add rule'),
      ),
    ],
  );
}

class _Field extends StatelessWidget {
  const _Field(this.controller, this.label, {this.lines = 1, this.type});
  final TextEditingController controller;
  final String label;
  final int lines;
  final TextInputType? type;

  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    maxLines: lines,
    keyboardType: type,
    textCapitalization: TextCapitalization.sentences,
    decoration: InputDecoration(labelText: label),
  );
}

class _Checklist extends StatelessWidget {
  const _Checklist(this.label, this.done);
  final String label;
  final bool done;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(
      children: [
        Icon(
          done ? Icons.check_circle_rounded : Icons.circle_outlined,
          color: done ? PllayzColors.green : PllayzColors.muted,
          size: 20,
        ),
        const SizedBox(width: 8),
        Text(label),
      ],
    ),
  );
}

class _OwnerLoading extends StatelessWidget {
  const _OwnerLoading();

  @override
  Widget build(BuildContext context) => const Center(
    child: Padding(
      padding: EdgeInsets.all(40),
      child: CircularProgressIndicator(strokeWidth: 2),
    ),
  );
}

class _OwnerLoadError extends StatelessWidget {
  const _OwnerLoadError(this.error, this.retry);
  final Object? error;
  final VoidCallback retry;

  @override
  Widget build(BuildContext context) => EmptyState(
    icon: Icons.cloud_off_rounded,
    title: 'Could not load owner data',
    message: '$error',
    action: FilledButton.icon(
      onPressed: retry,
      icon: const Icon(Icons.refresh_rounded),
      label: const Text('Try again'),
    ),
  );
}

String _weekday(dynamic value) {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  final index = value is int ? value : int.tryParse('$value') ?? 0;
  return days[index.clamp(0, 6)];
}

String _time(dynamic value) => '$value'.split(':').take(2).join(':');
