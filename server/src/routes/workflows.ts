import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

interface TriggerType {
  value: string;
  label: string;
  description: string;
}

interface ActionType {
  value: string;
  label: string;
  description: string;
  fields: string[];
}

interface WorkflowAction {
  type: string;
  config: Record<string, unknown>;
}

interface WorkflowTriggerConfig {
  stage?: string;
  min_value?: number;
  from_status?: string;
  to_status?: string;
  days_overdue?: number;
  days_before?: number;
  cron?: string;
  interval?: string;
}

interface WorkflowRow {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: string;
  actions: string;
  status: string;
  last_run: string | null;
  run_count: number;
  created_at: string;
  updated_at: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: WorkflowTriggerConfig;
  actions: WorkflowAction[];
  status: string;
  last_run: string | null;
  run_count: number;
  created_at: string;
  updated_at: string;
}

interface ExecutionResult {
  action: string;
  success: boolean;
  details?: unknown;
  error?: string;
}

const TRIGGER_TYPES: TriggerType[] = [
  { value: 'deal_stage_change', label: 'Deal Stage Changes', description: 'When a deal moves to a specific stage' },
  { value: 'deal_value_threshold', label: 'Deal Value Threshold', description: 'When a deal exceeds a value amount' },
  { value: 'contact_created', label: 'Contact Created', description: 'When a new contact is added' },
  { value: 'contact_status_change', label: 'Contact Status Changes', description: 'When a contact status is updated' },
  { value: 'invoice_overdue', label: 'Invoice Overdue', description: 'When an invoice becomes overdue' },
  { value: 'invoice_paid', label: 'Invoice Paid', description: 'When an invoice is marked as paid' },
  { value: 'scheduled', label: 'Scheduled / Recurring', description: 'Runs on a time schedule' },
  { value: 'activity_due', label: 'Activity Due Soon', description: 'When an activity is due within X days' }
];

const ACTION_TYPES: ActionType[] = [
  { value: 'create_activity', label: 'Create Activity', description: 'Create a task, call, or meeting', fields: ['type', 'subject', 'description', 'due_offset_days'] },
  { value: 'send_email', label: 'Send Notification', description: 'Send an internal notification', fields: ['subject_template', 'body_template'] },
  { value: 'update_deal', label: 'Update Deal', description: 'Change deal stage or probability', fields: ['target_stage', 'target_probability'] },
  { value: 'create_conversation', label: 'Create Conversation', description: 'Start a new conversation thread', fields: ['subject_template', 'channel'] },
  { value: 'update_contact', label: 'Update Contact', description: 'Change contact status or fields', fields: ['target_status'] },
  { value: 'webhook', label: 'Webhook / API Call', description: 'Send data to an external URL', fields: ['url', 'method', 'headers'] }
];

interface AIClient {
  apiKey: string;
  model: string;
  baseURL: string;
}

function getAIClient(): AIClient | null {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === 'sk-your-deepseek-api-key-here') return null;
  return { apiKey, model: process.env.DEEPSEEK_MODEL || 'deepseek-chat', baseURL: 'https://api.deepseek.com' };
}

async function callAI(prompt: string, systemPrompt: string): Promise<string | null> {
  const client = getAIClient();
  if (!client) return null;
  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: client.apiKey, baseURL: client.baseURL });
    const response = await openai.chat.completions.create({
      model: client.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });
    return response.choices[0].message.content;
  } catch {
    return null;
  }
}

function parseWorkflow(row: WorkflowRow): Workflow {
  return {
    ...row,
    trigger_config: JSON.parse(row.trigger_config || '{}'),
    actions: JSON.parse(row.actions || '[]')
  };
}

// Metadata for UI
router.get('/metadata', async (_req: Request, res: Response) => {
  try {
    res.json({ triggers: TRIGGER_TYPES, actions: ACTION_TYPES });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// List workflows
router.get('/', async (_req: Request, res: Response) => {
  try {
    const workflows = await db.prepare('SELECT * FROM workflows ORDER BY updated_at DESC').all() as WorkflowRow[];
    res.json(workflows.map(parseWorkflow));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Get single workflow
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const workflow = await db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as WorkflowRow | undefined;
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    const executions = await db.prepare(
      'SELECT * FROM workflow_executions WHERE workflow_id = ? ORDER BY created_at DESC LIMIT 20'
    ).all(req.params.id);

    res.json({ ...parseWorkflow(workflow), executions });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Create workflow
router.post('/', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    const { name, description, trigger_type, trigger_config, actions, status } = req.body;

    if (!name || !trigger_type) {
      return res.status(400).json({ error: 'Name and trigger_type are required' });
    }

    await db.prepare(`INSERT INTO workflows (id, name, description, trigger_type, trigger_config, actions, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      id, name, description || '', trigger_type,
      JSON.stringify(trigger_config || {}),
      JSON.stringify(actions || []),
      status || 'draft'
    );

    const row = await db.prepare('SELECT * FROM workflows WHERE id = ?').get(id) as WorkflowRow;
    res.status(201).json(parseWorkflow(row));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Update workflow
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Workflow not found' });

    const { name, description, trigger_type, trigger_config, actions, status } = req.body;
    const updates: string[] = [];
    const params: unknown[] = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (trigger_type !== undefined) { updates.push('trigger_type = ?'); params.push(trigger_type); }
    if (trigger_config !== undefined) { updates.push('trigger_config = ?'); params.push(JSON.stringify(trigger_config)); }
    if (actions !== undefined) { updates.push('actions = ?'); params.push(JSON.stringify(actions)); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(req.params.id);
      await db.prepare(`UPDATE workflows SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const row = await db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as WorkflowRow;
    res.json(parseWorkflow(row));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Delete workflow
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await db.prepare('DELETE FROM workflows WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Workflow not found' });
    res.json({ message: 'Workflow deleted' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Toggle workflow active/paused
router.post('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const workflow = await db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as WorkflowRow | undefined;
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    const newStatus = workflow.status === 'active' ? 'paused' : 'active';
    await db.prepare("UPDATE workflows SET status = ?, updated_at = datetime('now') WHERE id = ?").run(newStatus, req.params.id);
    res.json({ id: req.params.id, status: newStatus });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Execute workflow manually
router.post('/:id/execute', async (req: Request, res: Response) => {
  try {
    const row = await db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as WorkflowRow | undefined;
    if (!row) return res.status(404).json({ error: 'Workflow not found' });

    const workflow = parseWorkflow(row);
    const execId = uuidv4();
    const triggerData = req.body.trigger_data || {};

    await db.prepare(`INSERT INTO workflow_executions (id, workflow_id, status, trigger_data, started_at)
      VALUES (?, ?, 'running', ?, datetime('now'))`).run(execId, req.params.id, JSON.stringify(triggerData));

    const results: ExecutionResult[] = [];
    for (const action of workflow.actions) {
      try {
        const result = await executeAction(action, { workflow, trigger_data: triggerData });
        results.push({ action: action.type, success: true, details: result });
      } catch (err) {
        results.push({ action: action.type, success: false, error: (err as Error).message });
      }
    }

    await db.prepare(`UPDATE workflow_executions SET status = 'completed', result = ?, completed_at = datetime('now') WHERE id = ?`)
      .run(JSON.stringify(results), execId);

    await db.prepare("UPDATE workflows SET last_run = datetime('now'), run_count = run_count + 1, updated_at = datetime('now') WHERE id = ?")
      .run(req.params.id);

    const exec = await db.prepare('SELECT * FROM workflow_executions WHERE id = ?').get(execId);
    res.json({ execution: exec, results });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// AI chat endpoint for workflow generation
router.post('/ai/generate', async (req: Request, res: Response) => {
  try {
    const { message, conversation_history } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const triggerList = TRIGGER_TYPES.map(t => `- ${t.value}: ${t.description}`).join('\n');
    const actionList = ACTION_TYPES.map(a => `- ${a.value}: ${a.description} (fields: ${a.fields.join(', ')})`).join('\n');

    const systemPrompt = `You are a CRM workflow automation builder. Help users build automated workflows.

Available triggers:
${triggerList}

Available actions:
${actionList}

When a user describes what they want, respond with a JSON object containing:
{
  "type": "question" | "workflow_preview" | "clarification" | "suggestion",
  "message": "Your helpful message to the user",
  "workflow": null | {
    "name": "Workflow name",
    "description": "What this workflow does",
    "trigger_type": "one of the trigger types above",
    "trigger_config": { ... config matching the trigger type },
    "actions": [
      {
        "type": "one of the action types above",
        "config": { ... fields matching the action }
      }
    ]
  }
}

Rules:
- If the user is vague, ask clarifying questions (type: "question")
- Once you understand, build the workflow preview (type: "workflow_preview")
- Suggest improvements if applicable (type: "suggestion")
- Keep workflow names short and descriptive
- Use the EXACT trigger_type and action type values from the lists above
- trigger_config for deal_stage_change: { "stage": "stage_name" }
- trigger_config for deal_value_threshold: { "min_value": number }
- trigger_config for contact_created: {}
- trigger_config for contact_status_change: { "from_status": "old", "to_status": "new" }
- trigger_config for invoice_overdue: { "days_overdue": number }
- trigger_config for invoice_paid: {}
- trigger_config for scheduled: { "cron": "0 9 * * 1", "interval": "daily|weekly|monthly" }
- trigger_config for activity_due: { "days_before": number }
- For actions: config fields should match the action's field list
- Return valid JSON only, no markdown formatting`;

    const history = (conversation_history as { role: string; content: string }[] || [])
      .map(m => `${m.role}: ${m.content}`).join('\n');
    const prompt = `Previous conversation:\n${history}\n\nUser: ${message}`;

    const response = await callAI(prompt, systemPrompt);
    if (!response) {
      return res.json({
        type: 'message',
        message: 'AI is not configured. Please set your DEEPSEEK_API_KEY in server/.env'
      });
    }

    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      res.json(parsed);
    } catch {
      res.json({ type: 'message', message: response });
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Action execution engine
async function executeAction(
  action: WorkflowAction,
  context: { workflow: Workflow; trigger_data: Record<string, unknown> }
): Promise<Record<string, unknown>> {
  const { type, config } = action;

  switch (type) {
    case 'create_activity': {
      const activityId = uuidv4();
      const dueDate = typeof config.due_offset_days === 'number'
        ? new Date(Date.now() + config.due_offset_days * 86400000).toISOString().split('T')[0]
        : null;

      await db.prepare(`INSERT INTO activities (id, type, subject, description, contact_id, company_id, deal_id, status, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`).run(
        activityId,
        (config.type as string) || 'task',
        (config.subject as string) || 'Automated task',
        (config.description as string) || '',
        context.trigger_data?.contact_id || null,
        context.trigger_data?.company_id || null,
        context.trigger_data?.deal_id || null,
        dueDate
      );
      return { activity_id: activityId, type: config.type };
    }

    case 'update_deal': {
      if (context.trigger_data?.deal_id && config.target_stage) {
        await db.prepare("UPDATE deals SET stage = ?, updated_at = datetime('now') WHERE id = ?")
          .run(config.target_stage, context.trigger_data.deal_id);
      }
      if (context.trigger_data?.deal_id && config.target_probability) {
        await db.prepare("UPDATE deals SET probability = ?, updated_at = datetime('now') WHERE id = ?")
          .run(config.target_probability, context.trigger_data.deal_id);
      }
      return { updated: true };
    }

    case 'update_contact': {
      if (context.trigger_data?.contact_id && config.target_status) {
        await db.prepare("UPDATE contacts SET status = ?, updated_at = datetime('now') WHERE id = ?")
          .run(config.target_status, context.trigger_data.contact_id);
      }
      return { updated: true };
    }

    case 'send_email': {
      await db.prepare(`INSERT INTO activities (id, type, subject, description, contact_id, status)
        VALUES (?, 'email', ?, ?, ?, 'pending')`).run(
        uuidv4(),
        (config.subject_template as string) || 'Automated notification',
        (config.body_template as string) || '',
        context.trigger_data?.contact_id || null
      );
      return { notification_sent: true };
    }

    case 'create_conversation': {
      const convId = uuidv4();
      await db.prepare(`INSERT INTO conversations (id, contact_id, company_id, deal_id, subject, channel, status)
        VALUES (?, ?, ?, ?, ?, ?, 'open')`).run(
        convId,
        context.trigger_data?.contact_id || null,
        context.trigger_data?.company_id || null,
        context.trigger_data?.deal_id || null,
        (config.subject_template as string) || 'Automated conversation',
        (config.channel as string) || 'email'
      );
      return { conversation_id: convId };
    }

    default:
      return { action: type, note: 'Action type has no local handler' };
  }
}

export default router;
export { TRIGGER_TYPES, ACTION_TYPES };
