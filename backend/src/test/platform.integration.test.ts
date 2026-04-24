import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../app";

process.env.NODE_ENV = "test";

const asAdmin = (req: request.Test) => req.set("x-dev-user-role", "admin");

test("health endpoint should respond", async () => {
  const res = await request(app).get("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.status.includes("OK"), true);
});

test("crm: create and list lead", async () => {
  const create = await asAdmin(
    request(app)
      .post("/api/leads")
      .send({
        name: "Integration Lead",
        contact: "Test Contact",
        value: "$10,000",
        score: 70,
        stage: "Discovery",
        sentiment: "neutral",
        probability: "55%",
        lastContact: "now",
        priority: "warm",
      })
  );

  assert.equal(create.status, 201);
  assert.ok(create.body.id);

  const list = await asAdmin(request(app).get("/api/leads"));
  assert.equal(list.status, 200);
  assert.equal(Array.isArray(list.body), true);
  assert.equal(list.body.some((l: any) => l.id === create.body.id), true);
});

test("payments: create and update payment", async () => {
  const created = await asAdmin(
    request(app)
      .post("/api/payments/invoice")
      .send({ client: "Integration Lead", amount: "$2,500", type: "invoice" })
  );

  assert.equal(created.status, 201);
  assert.ok(created.body.id);

  const updated = await asAdmin(
    request(app)
      .put(`/api/payments/${created.body.id}`)
      .send({ status: "completed" })
  );

  assert.equal(updated.status, 200);
  assert.equal(updated.body.status, "completed");
});

test("tasks: create task", async () => {
  const created = await asAdmin(
    request(app)
      .post("/api/tasks")
      .send({
        title: "Integration Task",
        priority: "high",
        status: "todo",
        assignee: "You",
        due: "Today",
        agent: "System",
        estimated: "30m",
        progress: 0,
      })
  );

  assert.equal(created.status, 201);
  assert.equal(created.body.title, "Integration Task");
});

test("messaging: send message", async () => {
  const list = await asAdmin(request(app).get("/api/messages"));
  assert.equal(list.status, 200);
  assert.ok(list.body.length > 0);

  const convId = list.body[0].id;
  const sent = await asAdmin(
    request(app)
      .post("/api/messages")
      .send({ convId, text: "Integration ping" })
  );

  assert.equal(sent.status, 201);
  assert.equal(sent.body.text, "Integration ping");
});

test("workflows: run workflow", async () => {
  const workflows = await asAdmin(request(app).get("/api/workflows"));
  assert.equal(workflows.status, 200);
  assert.ok(workflows.body.length > 0);

  const workflowId = workflows.body[0].id;
  const run = await asAdmin(request(app).post(`/api/workflows/${workflowId}/run`).send({ source: "integration-test" }));

  assert.equal(run.status, 200);
  assert.equal(run.body.status, "completed");
});
