import { createCustomer } from '../services/customer.service.js';

export const submitCustomer = async (req, res) => {
  try {
    const {
      name,
      phone_no,
      address,
      aadhaar_no,
      illness,
      remarks,
      donation_amount,
      meet_mahant_ji,
      total_amount,
      mahant_meeting_amount,
    } = req.body;

    // ── Required field validation ─────────────────────────────────────────────
    if (!name || !String(name).trim())
      return res.status(400).json({ error: 'Name is required' });
    if (String(name).trim().length > 100)
      return res.status(400).json({ error: 'Name must be 100 characters or fewer' });

    if (!address || !String(address).trim())
      return res.status(400).json({ error: 'Address is required' });
    if (String(address).trim().length > 300)
      return res.status(400).json({ error: 'Address must be 300 characters or fewer' });

    const cleanPhone = String(phone_no ?? '').replace(/\D/g, '');
    if (cleanPhone.length !== 10)
      return res.status(400).json({ error: 'Valid 10-digit phone number is required' });

    const cleanAadhaar = String(aadhaar_no ?? '').replace(/\s/g, '');
    if (cleanAadhaar.length > 0 && !/^\d{12}$/.test(cleanAadhaar))
      return res.status(400).json({ error: 'Valid 12-digit Aadhaar number is required' });

    const parsedDonation = parseFloat(donation_amount);
    if (isNaN(parsedDonation) || parsedDonation < 0)
      return res.status(400).json({ error: 'Valid donation amount is required' });

    const parsedTotal = parseFloat(total_amount);
    if (isNaN(parsedTotal) || parsedTotal <= 0)
      return res.status(400).json({ error: 'Total amount must be greater than 0' });

    const customer = await createCustomer({
      name: String(name).trim(),
      phone_no: cleanPhone,
      address: String(address).trim(),
      aadhaar_no: cleanAadhaar || null,
      illness: illness ? String(illness).trim().slice(0, 200) || null : null,
      remarks: remarks ? String(remarks).trim().slice(0, 500) : '',
      donation_amount: parsedDonation,
      meet_mahant_ji: true,
      total_amount: parsedTotal,
      mahant_meeting_amount: parseFloat(mahant_meeting_amount) || 0,
    });

    return res.status(201).json({ success: true, data: customer });
  } catch (err) {
    console.error('Customer submission error:', err);
    return res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
};
