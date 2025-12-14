import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { domain } = req.query;

  if (req.method === 'GET') {
    try {
      const { mailgunRequest } = await import('./utils');
      const mgRes = await mailgunRequest('GET', `/domains/${domain}`);
      res.status(mgRes.status).json(mgRes.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json({
        error: error.response?.data || error.message,
      });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { mailgunRequest } = await import('./utils');
      const mgRes = await mailgunRequest('DELETE', `/domains/${domain}`);
      res.status(mgRes.status).json(mgRes.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json({
        error: error.response?.data || error.message,
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
