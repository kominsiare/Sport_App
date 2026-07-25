import 'package:flutter/material.dart';

import '../../data/pllayz_repository.dart';
import '../../ui/app_theme.dart';
import '../owner/owner_pages.dart';
import '../player/player_pages.dart';
import '../profile/profile_page.dart';

class AdaptiveShell extends StatefulWidget {
  const AdaptiveShell({required this.profile, super.key});

  final Json profile;

  @override
  State<AdaptiveShell> createState() => _AdaptiveShellState();
}

class _AdaptiveShellState extends State<AdaptiveShell> {
  int _index = 0;

  bool get _owner => widget.profile['account_type'] == 'owner';

  List<_Destination> get _destinations => _owner
      ? const [
          _Destination('Dashboard', Icons.grid_view_rounded),
          _Destination('Venues', Icons.storefront_rounded),
          _Destination('Activity', Icons.receipt_long_rounded),
          _Destination('Profile', Icons.person_outline_rounded),
        ]
      : const [
          _Destination('Home', Icons.home_rounded),
          _Destination('Venues', Icons.stadium_rounded),
          _Destination('Bookings', Icons.calendar_month_rounded),
          _Destination('Opponents', Icons.groups_2_rounded),
          _Destination('Profile', Icons.person_outline_rounded),
        ];

  List<Widget> get _pages => _owner
      ? [
          const OwnerDashboardPage(),
          const OwnerVenuesPage(),
          const OwnerActivityPage(),
          ProfilePage(profile: widget.profile),
        ]
      : [
          PlayerHomePage(onOpen: (value) => setState(() => _index = value)),
          const PlayerVenuesPage(),
          const PlayerBookingsPage(),
          const OpponentFinderPage(),
          ProfilePage(profile: widget.profile),
        ];

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= 860;
    final pages = _pages;
    final body = IndexedStack(index: _index, children: pages);
    if (!wide) {
      return Scaffold(
        body: SafeArea(bottom: false, child: body),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _index,
          onDestinationSelected: (value) => setState(() => _index = value),
          destinations: _destinations
              .map(
                (item) => NavigationDestination(
                  icon: Icon(item.icon),
                  label: item.label,
                ),
              )
              .toList(),
        ),
      );
    }
    return Scaffold(
      body: SafeArea(
        child: Row(
          children: [
            Container(
              width: 230,
              padding: const EdgeInsets.fromLTRB(18, 24, 18, 18),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(right: BorderSide(color: PllayzColors.border)),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Image.asset('assets/pllayz-mark.png', width: 44),
                      const SizedBox(width: 10),
                      Text(
                        'Pllayz',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                  Expanded(
                    child: NavigationRail(
                      extended: true,
                      backgroundColor: Colors.transparent,
                      selectedIndex: _index,
                      onDestinationSelected: (value) =>
                          setState(() => _index = value),
                      labelType: NavigationRailLabelType.none,
                      destinations: _destinations
                          .map(
                            (item) => NavigationRailDestination(
                              icon: Icon(item.icon),
                              label: Text(item.label),
                            ),
                          )
                          .toList(),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(child: body),
          ],
        ),
      ),
    );
  }
}

class _Destination {
  const _Destination(this.label, this.icon);
  final String label;
  final IconData icon;
}
