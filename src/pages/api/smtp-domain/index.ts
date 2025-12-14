import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { name, smtp_password, ...rest } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Domain name is required.' });
      }
      // See Mailgun docs for required fields: https://documentation.mailgun.com/en/latest/api-domains.html#domains
      const data: any = {
        name,
        ...rest,
      };
      if (smtp_password) {
        data.smtp_password = smtp_password;
      }
      const { mailgunRequest } = await import('./utils');
      const mgRes = await mailgunRequest('POST', '/domains', data);
      res.status(mgRes.status).json(mgRes.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json({
        error: error.response?.data || error.message,
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
