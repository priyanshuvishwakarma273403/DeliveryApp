import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/features/orders/domain/models/rider_location_model.dart';
import 'package:latlong2/latlong.dart' hide Path;

class LiveTrackingMap extends StatelessWidget {
  final RiderLocationModel? riderLocation;
  final String restaurantName;
  final String deliveryAddress;
  final int etaMinutes;
  final double distanceKm;

  const LiveTrackingMap({
    super.key,
    this.riderLocation,
    required this.restaurantName,
    required this.deliveryAddress,
    required this.etaMinutes,
    required this.distanceKm,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 240,
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B), // Dark slate map background
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.12),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Simulated Styled Map Grid & Road Canvas
          CustomPaint(
            size: Size.infinite,
            painter: _RoadMapPainter(),
          ),

          // Restaurant Pin
          const Positioned(
            left: 40,
            top: 50,
            child: _MapPin(
              label: 'Kitchen',
              icon: Icons.restaurant,
              color: AppColors.accentOrange,
            ),
          ),

          // Customer Delivery Pin
          const Positioned(
            right: 40,
            bottom: 50,
            child: _MapPin(
              label: 'Your Doorstep',
              icon: Icons.home,
              color: AppColors.vegGreen,
            ),
          ),

          // Animated Rider Pin
          Positioned(
            left: 120,
            top: 90,
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.primaryRed,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primaryRed.withOpacity(0.5),
                        blurRadius: 12,
                        spreadRadius: 3,
                      ),
                    ],
                  ),
                  child: const Icon(Icons.two_wheeler, color: Colors.white, size: 22),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.black87,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'Rider on the move',
                    style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),

          // Floating ETA & Distance Banner
          Positioned(
            top: 14,
            left: 14,
            right: 14,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.15),
                    blurRadius: 8,
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.timer_outlined, color: AppColors.primaryRed, size: 20),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Estimated Delivery', style: TextStyle(fontSize: 10, color: Colors.grey)),
                          Text(
                            '~ $etaMinutes mins',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.primaryRed),
                          ),
                        ],
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primaryRed.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${distanceKm.toStringAsFixed(1)} km away',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryRed),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapPin extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;

  const _MapPin({
    required this.label,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: color.withOpacity(0.4),
                blurRadius: 8,
              ),
            ],
          ),
          child: Icon(icon, color: Colors.white, size: 18),
        ),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: Colors.black87,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            label,
            style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }
}

class _RoadMapPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final roadPaint = Paint()
      ..color = Colors.white.withOpacity(0.12)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.0;

    final routePaint = Paint()
      ..color = AppColors.primaryRed.withOpacity(0.8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.5
      ..strokeCap = StrokeCap.round;

    // Background road vectors
    canvas.drawLine(Offset(0, size.height * 0.4), Offset(size.width, size.height * 0.4), roadPaint);
    canvas.drawLine(Offset(size.width * 0.5, 0), Offset(size.width * 0.5, size.height), roadPaint);

    // Active route curve connecting kitchen -> rider -> customer
    final path = Path();
    path.moveTo(60, 70);
    path.quadraticBezierTo(130, 75, 140, 115);
    path.quadraticBezierTo(160, 180, size.width - 60, size.height - 70);

    canvas.drawPath(path, routePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
