import 'package:flutter_test/flutter_test.dart';
import 'package:pllayz_mobile/main.dart';

void main() {
  testWidgets('shows a useful message without build configuration', (
    tester,
  ) async {
    await tester.pumpWidget(const PllayzApp());
    expect(find.text('Build configuration missing'), findsOneWidget);
    expect(find.textContaining('SUPABASE_PUBLISHABLE_KEY'), findsOneWidget);
  });
}
