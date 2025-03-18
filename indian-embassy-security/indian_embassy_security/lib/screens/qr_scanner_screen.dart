import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../models/qr_data.dart';
import '../utils/qr_decryption_utils.dart';

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({Key? key}) : super(key: key);

  @override
  _QRScannerScreenState createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  final ImagePicker _picker = ImagePicker();
  late MobileScannerController _scannerController;
  QRData? _decodedData;
  String _status = "Ready to scan QR code";
  bool _isLoading = false;
  bool _hasScanned = false;
  File? _selectedImage;
  final TextEditingController _qrDataController = TextEditingController();

  // Event-related properties
  String? _eventId;
  String? _eventTitle;
  Map<String, dynamic>? _attendeeData;
  bool _verificationSuccessful = false;

  @override
  void initState() {
    super.initState();
    _scannerController = MobileScannerController(
      detectionSpeed: DetectionSpeed.normal,
      formats: [BarcodeFormat.qrCode],
      facing: CameraFacing.back,
      torchEnabled: false,
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    
    // Get event info from route arguments
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args != null) {
      setState(() {
        _eventId = args['eventId'];
        _eventTitle = args['eventTitle'];
      });
    }
    
    // Check if event was selected
    if (_eventId == null) {
      // Show error and navigate back after delay
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No event selected. Please select an event first.'),
            backgroundColor: Colors.red,
          ),
        );
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            Navigator.pop(context);
          }
        });
      });
    }
  }

  @override
  void dispose() {
    _scannerController.dispose();
    _qrDataController.dispose();
    super.dispose();
  }

  // Method to pick an image from gallery
  Future<void> _pickImage() async {
    setState(() {
      _isLoading = true;
      _status = "Selecting image...";
    });

    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1800,
        maxHeight: 1800,
      );

      if (pickedFile == null) {
        setState(() {
          _isLoading = false;
          _status = "No image selected";
        });
        return;
      }

      // Save the image and show in UI
      final File imageFile = File(pickedFile.path);
      setState(() {
        _selectedImage = imageFile;
        _status = "Image selected. Enter QR data or test string below:";
        _isLoading = false;
      });
      
      // For simplicity, let's simulate a QR scan with a test string
      // In a real app, you would use a QR code scanner package to scan the image
      print("Image selected: ${imageFile.path}");
      
      // Populate the text field with a default value for testing
      _qrDataController.text = "test_qr_data_from_image";
    } catch (e) {
      setState(() {
        _isLoading = false;
        _status = "Error picking image: $e";
      });
      print("Error picking image: $e");
    }
  }

  // Process QR code data
  Future<void> _processQRData(String qrData) async {
    if (_hasScanned || _eventId == null) return;

    setState(() {
      _hasScanned = true;
      _isLoading = true;
      _status = "Processing QR code...";
    });

    try {
      // Decode the QR data
      final QRData decodedData = await QRDecryptionUtils.decodeQRData(qrData);
      
      // Verify the QR code data with Firestore
      final Map<String, dynamic> verificationResult = 
          await QRDecryptionUtils.verifyQRCodeWithFirestore(
            decodedData.userId, 
            _eventId!,
          );
      
      if (verificationResult['valid'] == true) {
        // Update the QR data with user information from Firestore
        final userData = verificationResult['userData'];
        decodedData.displayName = userData['displayName'];
        decodedData.photoURL = userData['photoURL'];
        
        setState(() {
          _decodedData = decodedData;
          _attendeeData = userData;
          _verificationSuccessful = true;
          _isLoading = false;
          _status = "Attendee verified successfully!";
        });
        
        // Show success dialog
        _showAttendeeVerifiedDialog(userData);
      } else {
        setState(() {
          _decodedData = decodedData;
          _verificationSuccessful = false;
          _isLoading = false;
          _status = "Verification failed: ${verificationResult['reason']}";
        });
        
        // Show error dialog
        _showVerificationFailedDialog(verificationResult['reason']);
      }
    } catch (e) {
      print("ERROR PROCESSING QR: $e");
      setState(() {
        _verificationSuccessful = false;
        _isLoading = false;
        _status = "Error: $e";
      });
      
      // Show error dialog
      _showVerificationFailedDialog("Invalid QR code format");
    }
  }

  // Show verification success dialog
  void _showAttendeeVerifiedDialog(Map<String, dynamic> userData) {
    if (!mounted) return;
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.green, size: 28),
            const SizedBox(width: 8),
            const Text('Attendee Verified'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (userData['photoURL'] != null && userData['photoURL'].isNotEmpty)
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  image: DecorationImage(
                    fit: BoxFit.cover,
                    image: NetworkImage(userData['photoURL']),
                  ),
                ),
                margin: const EdgeInsets.only(bottom: 16),
              )
            else
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.grey[300],
                ),
                margin: const EdgeInsets.only(bottom: 16),
                child: const Icon(Icons.person, size: 80, color: Colors.white),
              ),
            Text(
              userData['displayName'] ?? 'Unknown User',
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            if (userData['email'] != null && userData['email'].isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: Text(
                  userData['email'],
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.green[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.green),
              ),
              child: Row(
                children: [
                  const Icon(Icons.event_available, color: Colors.green),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Verified for: $_eventTitle',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          'User ID: ${userData['userId']}',
                          style: const TextStyle(fontSize: 12),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              _resetScanner();
            },
            child: const Text('Scan Another'),
          ),
        ],
      ),
    );
  }

  // Show verification failed dialog
  void _showVerificationFailedDialog(String reason) {
    if (!mounted) return;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.error, color: Colors.red, size: 28),
            const SizedBox(width: 8),
            const Text('Verification Failed'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.warning_amber,
              size: 64,
              color: Colors.orange,
            ),
            const SizedBox(height: 16),
            Text(
              reason,
              style: const TextStyle(fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info, color: Colors.red),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Please verify the attendee details or try again',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          'Event: $_eventTitle',
                          style: const TextStyle(fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              _resetScanner();
            },
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }

  // Reset scanner to scan another code
  void _resetScanner() {
    setState(() {
      _decodedData = null;
      _attendeeData = null;
      _hasScanned = false;
      _verificationSuccessful = false;
      _status = "Ready to scan another QR code";
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_eventTitle != null ? 'Scan: $_eventTitle' : 'VVG QR Scanner'),
      ),
      body: Column(
        children: [
          // Status indicator
          Container(
            padding: const EdgeInsets.all(16.0),
            color: _getStatusColor(),
            width: double.infinity,
            child: Text(
              _status,
              style: const TextStyle(color: Colors.white),
              textAlign: TextAlign.center,
            ),
          ),
          
          // Event info
          if (_eventId != null && _eventTitle != null)
            Container(
              padding: const EdgeInsets.all(12.0),
              color: Colors.grey[100],
              width: double.infinity,
              child: Row(
                children: [
                  const Icon(Icons.event, color: Colors.black),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Selected Event: $_eventTitle',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          'Event ID: $_eventId',
                          style: const TextStyle(fontSize: 12),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          
          // Main content area
          if (_eventId == null)
            const Expanded(
              child: Center(
                child: Text('Please select an event from the home screen'),
              ),
            )
          else if (_decodedData == null)
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : Stack(
                      children: [
                        // Camera scanner
                        MobileScanner(
                          controller: _scannerController,
                          onDetect: (capture) {
                            if (_hasScanned) return;
                            final List<Barcode> barcodes = capture.barcodes;
                            if (barcodes.isNotEmpty && barcodes.first.rawValue != null) {
                              print("DETECTED QR: ${barcodes.first.rawValue}");
                              _processQRData(barcodes.first.rawValue!);
                            }
                          },
                        ),
                        
                        // Overlay for scan guidance
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.black.withAlpha(128),
                            ),
                            child: Center(
                              child: Container(
                                width: 250,
                                height: 250,
                                decoration: BoxDecoration(
                                  border: Border.all(color: Colors.white, width: 2.0),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    // Scan label
                                    if (!_hasScanned)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.8),
                                          borderRadius: BorderRadius.circular(16),
                                        ),
                                        child: const Text(
                                          'Scan QR Code',
                                          style: TextStyle(
                                            color: Colors.black,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                        
                        // Torch toggle
                        Positioned(
                          bottom: 20,
                          right: 20,
                          child: CircleAvatar(
                            backgroundColor: Colors.white.withAlpha(128),
                            radius: 28,
                            child: IconButton(
                              icon: const Icon(Icons.flash_on, color: Colors.black),
                              onPressed: () => _scannerController.toggleTorch(),
                            ),
                          ),
                        ),
                      ],
                    ),
            ),
        ],
      ),
    );
  }

  // Get status color based on current status
  Color _getStatusColor() {
    if (_status.contains('Error') || _status.contains('Failed')) {
      return Colors.red;
    } else if (_status.contains('Success') || _verificationSuccessful) {
      return Colors.black;
    } else if (_status.contains('Processing') || _status.contains('Selecting')) {
      return Colors.grey.shade700;
    } else {
      return Colors.black;
    }
  }
}