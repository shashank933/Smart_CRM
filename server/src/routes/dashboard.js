import { Router } from 'express';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/stats', async (req, res) => {
  try {
    const totalContacts = (await db.prepare('SELECT COUNT(*) as total FROM contacts').get()).total;
    const totalCompanies = (await db.prepare('SELECT COUNT(*) as total FROM companies').get()).total;
    const totalDeals = (await db.prepare('SELECT COUNT(*) as total FROM deals').get()).total;
    const openDeals = (await db.prepare("SELECT COUNT(*) as total FROM deals WHERE stage NOT IN ('closed_won','closed_lost')").get()).total;
    const wonDeals = (await db.prepare("SELECT COUNT(*) as total FROM deals WHERE stage = 'closed_won'").get()).total;
    const totalRevenue = (await db.prepare("SELECT COALESCE(SUM(value), 0) as total FROM deals WHERE stage = 'closed_won'").get()).total;
    const pipelineValue = (await db.prepare("SELECT COALESCE(SUM(value), 0) as total FROM deals WHERE stage NOT IN ('closed_won','closed_lost')").get()).total;
    const totalInvoices = (await db.prepare('SELECT COUNT(*) as total FROM invoices').get()).total;
    const unpaidInvoices = (await db.prepare("SELECT COUNT(*) as total FROM invoices WHERE status IN ('sent','overdue')").get()).total;
    const outstandingAmount = (await db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE status IN ('sent','overdue')").get()).total;
    const openConversations = (await db.prepare("SELECT COUNT(*) as total FROM conversations WHERE status = 'open'").get()).total;

    const totalTickets = (await db.prepare('SELECT COUNT(*) as total FROM tickets').get()).total;
    const openTickets = (await db.prepare("SELECT COUNT(*) as total FROM tickets WHERE status NOT IN ('resolved','closed')").get()).total;
    const urgentTickets = (await db.prepare("SELECT COUNT(*) as total FROM tickets WHERE priority = 'urgent' AND status NOT IN ('resolved','closed')").get()).total;

    const winRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;

    const recentDeals = await db.prepare(`SELECT d.*, c.first_name || ' ' || c.last_name as contact_name
      FROM deals d LEFT JOIN contacts c ON d.contact_id = c.id
      ORDER BY d.updated_at DESC LIMIT 5`).all();

    const recentContacts = await db.prepare(`SELECT c.*, cmp.name as company_name
      FROM contacts c LEFT JOIN companies cmp ON c.company_id = cmp.id
      ORDER BY c.created_at DESC LIMIT 5`).all();

    const dealsByStage = await db.prepare(`SELECT stage, COUNT(*) as count, COALESCE(SUM(value), 0) as value
      FROM deals GROUP BY stage`).all();

    const revenueByMonth = await db.prepare(`
      SELECT strftime('%Y-%m', won_date) as month, COALESCE(SUM(value), 0) as total
      FROM deals WHERE stage = 'closed_won' AND won_date IS NOT NULL
      GROUP BY month ORDER BY month DESC LIMIT 12`).all();

    res.json({
      totalContacts, totalCompanies, totalDeals, openDeals, wonDeals,
      totalRevenue, pipelineValue, winRate,
      totalInvoices, unpaidInvoices, outstandingAmount,
      openConversations,
      totalTickets, openTickets, urgentTickets,
      recentDeals, recentContacts, dealsByStage, revenueByMonth
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recent-activities', async (req, res) => {
  try {
    const activities = await db.prepare(`SELECT a.*, c.first_name || ' ' || c.last_name as contact_name,
      d.name as deal_name, cmp.name as company_name
      FROM activities a
      LEFT JOIN contacts c ON a.contact_id = c.id
      LEFT JOIN deals d ON a.deal_id = d.id
      LEFT JOIN companies cmp ON a.company_id = cmp.id
      ORDER BY a.created_at DESC LIMIT 20`).all();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
