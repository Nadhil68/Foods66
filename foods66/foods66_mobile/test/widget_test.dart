import 'package:flutter/material.dart';
import 'package:foods66_mobile/main.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Foods66App renders splash screen with brand', (WidgetTester tester) async {
    await tester.pumpWidget(const Foods66App());

    // Verify that the splash screen renders with the FOODS66 brand name
    expect(find.text('FOODS66'), findsOneWidget);
    expect(find.text('Delicious Food, Delivered'), findsOneWidget);

    // Verify the loading indicator is present
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    // Pump past the 2-second splash delay and allow async navigation to settle.
    // The timer and API call will fire; errors are expected in test since no
    // backend is running, but the framework just needs the timer to drain.
    await tester.pump(const Duration(seconds: 3));

    // Allow remaining microtasks / frames to flush without asserting on navigation
    // (we can't fully navigate without a running backend).
    await tester.pump(const Duration(seconds: 1));
  });
}
