import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import 'app_theme.dart';

const webBaseUrl = String.fromEnvironment(
  'WEB_BASE_URL',
  defaultValue: 'https://pllayz-app.vercel.app',
);

final _money = NumberFormat.currency(
  locale: 'en_IN',
  symbol: '₹',
  decimalDigits: 0,
);

String money(dynamic value) =>
    _money.format(value is num ? value : num.tryParse('$value') ?? 0);

String dateTimeLabel(dynamic value) {
  final parsed = DateTime.tryParse('$value')?.toLocal();
  if (parsed == null) return 'Time unavailable';
  return DateFormat('EEE, d MMM • h:mm a').format(parsed);
}

String shortDate(dynamic value) {
  final parsed = DateTime.tryParse('$value')?.toLocal();
  if (parsed == null) return '—';
  return DateFormat('d MMM').format(parsed);
}

String imageUrl(dynamic value) {
  final raw = '$value';
  if (raw.startsWith('https://')) return raw;
  if (raw.startsWith('/')) return '$webBaseUrl$raw';
  return '$webBaseUrl/assets/night-match-hero.png';
}

void showMessage(BuildContext context, String message, {bool error = false}) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: error ? PllayzColors.red : PllayzColors.ink,
      ),
    );
}

class PageFrame extends StatelessWidget {
  const PageFrame({
    required this.title,
    required this.subtitle,
    required this.child,
    this.actions = const [],
    super.key,
  });

  final String title;
  final String subtitle;
  final Widget child;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async {
        final state = context.findAncestorStateOfType<ReloadableState>();
        await state?.reload();
      },
      child: CustomScrollView(
        key: PageStorageKey(title),
        slivers: [
          SliverPadding(
            padding: EdgeInsets.fromLTRB(
              MediaQuery.sizeOf(context).width >= 700 ? 32 : 20,
              24,
              MediaQuery.sizeOf(context).width >= 700 ? 32 : 20,
              12,
            ),
            sliver: SliverToBoxAdapter(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 6),
                        Text(subtitle),
                      ],
                    ),
                  ),
                  ...actions,
                ],
              ).animate().fadeIn(duration: 320.ms).slideY(begin: .08, end: 0),
            ),
          ),
          SliverPadding(
            padding: EdgeInsets.fromLTRB(
              MediaQuery.sizeOf(context).width >= 700 ? 32 : 20,
              8,
              MediaQuery.sizeOf(context).width >= 700 ? 32 : 20,
              112,
            ),
            sliver: SliverToBoxAdapter(child: child),
          ),
        ],
      ),
    );
  }
}

abstract class ReloadableState<T extends StatefulWidget> extends State<T> {
  Future<void> reload();
}

class PllayzCard extends StatelessWidget {
  const PllayzCard({
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.color,
    this.onTap,
    super.key,
  });

  final Widget child;
  final EdgeInsets padding;
  final Color? color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: color,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Padding(padding: padding, child: child),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.title, {this.trailing, super.key});

  final String title;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 8, bottom: 12),
    child: Row(
      children: [
        Expanded(
          child: Text(title, style: Theme.of(context).textTheme.titleLarge),
        ),
        trailing ?? const SizedBox.shrink(),
      ],
    ),
  );
}

class StatusPill extends StatelessWidget {
  const StatusPill(this.value, {super.key});

  final String value;

  @override
  Widget build(BuildContext context) {
    final lower = value.toLowerCase();
    final positive = [
      'active',
      'available',
      'confirmed',
      'captured',
      'approved',
      'matched',
      'converted',
    ].any(lower.contains);
    final negative = [
      'failed',
      'cancelled',
      'expired',
      'rejected',
      'suspended',
    ].any(lower.contains);
    final color = positive
        ? PllayzColors.green
        : negative
        ? PllayzColors.red
        : PllayzColors.amber;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .11),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        value.replaceAll('_', ' '),
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class MetricTile extends StatelessWidget {
  const MetricTile({
    required this.label,
    required this.value,
    required this.icon,
    this.tint = PllayzColors.green,
    super.key,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color tint;

  @override
  Widget build(BuildContext context) => PllayzCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: tint, size: 22),
        const SizedBox(height: 18),
        Text(value, style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 4),
        Text(label, style: Theme.of(context).textTheme.bodyMedium),
      ],
    ),
  );
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    required this.icon,
    required this.title,
    required this.message,
    this.action,
    super.key,
  });

  final IconData icon;
  final String title;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) => PllayzCard(
    child: Padding(
      padding: const EdgeInsets.symmetric(vertical: 32),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Column(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: const BoxDecoration(
                  color: PllayzColors.mint,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: PllayzColors.green, size: 28),
              ),
              const SizedBox(height: 16),
              Text(
                title,
                style: Theme.of(context).textTheme.titleLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(message, textAlign: TextAlign.center),
              if (action != null) ...[const SizedBox(height: 20), action!],
            ],
          ),
        ),
      ),
    ),
  );
}

class VenuePhoto extends StatelessWidget {
  const VenuePhoto(this.url, {this.height = 160, super.key});

  final dynamic url;
  final double height;

  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(14),
    child: CachedNetworkImage(
      imageUrl: imageUrl(url),
      height: height,
      width: double.infinity,
      fit: BoxFit.cover,
      placeholder: (_, _) => Container(
        height: height,
        color: PllayzColors.mint,
        child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
      ),
      errorWidget: (_, _, _) => Image.asset(
        'assets/night-match-hero.png',
        height: height,
        width: double.infinity,
        fit: BoxFit.cover,
      ),
    ),
  );
}

class BusyButton extends StatelessWidget {
  const BusyButton({
    required this.busy,
    required this.onPressed,
    required this.label,
    this.icon,
    super.key,
  });

  final bool busy;
  final VoidCallback? onPressed;
  final String label;
  final IconData? icon;

  @override
  Widget build(BuildContext context) => FilledButton.icon(
    onPressed: busy ? null : onPressed,
    icon: busy
        ? const SizedBox.square(
            dimension: 17,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Colors.white,
            ),
          )
        : Icon(icon ?? Icons.arrow_forward_rounded),
    label: Text(busy ? 'Please wait…' : label),
  );
}
