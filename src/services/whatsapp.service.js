import axios from "axios"

const formatDate = (isoDate) => {
    return new Date(isoDate).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

export const sendWhatsappMessage = async (data) => {
    const receiptUrl = `${process.env.FRONTEND_URL}/receipt?token=${data.qr_token}`;

    const response = await axios.post(
        `https://graph.facebook.com/${process.env.VERSION}/${process.env.META_PHONE_ID}/messages`,
        {
            messaging_product: "whatsapp",
            to: data.phone_no,
            type: "template",
            template: {
                name: "registrations_notification_2",
                language: { code: "en" },
                components: [
                    {
                        type: "body",
                        parameters: [
                            { type: "text", text: String(data.reg_no) },
                            { type: "text", text: receiptUrl },
                            { type: "text", text: data.created_at ? formatDate(data.created_at) : formatDate(new Date().toISOString()) }
                        ]
                    },
                    {
                        type: "button",
                        sub_type: "url",
                        index: "0",
                        parameters: [
                            { type: "text", text: data.qr_token }
                        ]
                    }
                ]
            }
        },
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.META_TOKEN}`
            }
        }
    );

    return response.data;
};