import supertest from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

import { Server } from "../server";

describe("Server", () => {
	let request: supertest.SuperTest<supertest.Test>;
	beforeAll(async () => {
		const server = new Server();
		const app = await server.bootstrap();
		request = supertest(app);
	});

	it("should have a 400 error on rechercher endpoint call without param", async () => {
		const res = await request.get("/api/rechercher");
		expect(res.status).toBe(400);
	});

	it("should list employees on rechercher endpoint call with 'mode=all' param", async () => {
		const res = await request.get("/api/rechercher?mode=all");
		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(2);
	});

	it("should get employee by name on rechercher endpoint call with 'name' param", async () => {
		const res = await request.get("/api/rechercher?name=DUPOND");
		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(1);
	});

	it("should have a 400 error on ajouter endpoint call with negative salary", async () => {
		const res = await request.post(
			"/api/ajouter?id=test&name=doe&lastname=john&salary=-10&level=1",
		);
		expect(res.status).toBe(400);
	});

	it("should have a 400 error on ajouter endpoint call with level > 10", async () => {
		const res = await request.post(
			"/api/ajouter?id=test&name=doe&lastname=john&salary=10&level=11",
		);
		expect(res.status).toBe(400);
	});

	it("should have a 400 error on ajouter endpoint call without id", async () => {
		const res = await request.post(
			"/api/ajouter?name=doe&lastname=john&salary=10&level=4",
		);
		expect(res.status).toBe(400);
	});

	it("should have a 409 error on ajouter endpoint call and employee already exists", async () => {
		const res = await request.post(
			"/api/ajouter?id=SAL1&name=doe&lastname=john&salary=10&level=4",
		);
		expect(res.status).toBe(409);
		expect(res.text).toEqual("Le matricule existe déjà");
	});

	it("should create employee on ajouter endpoint call", async () => {
		const res = await request.post(
			"/api/ajouter?id=DOEJ&name=doe&lastname=john&salary=10&level=4",
		);
		expect(res.status).toBe(201);
	});

	it("should have a 404 error on modifier endpoint call and employee doesn't exists", async () => {
		const res = await request.post(
			"/api/modifier/notexists?name=doe&lastname=john&salary=10&level=4",
		);
		expect(res.status).toBe(404);
		expect(res.text).toEqual("Le matricule n'a pas été trouvé");
	});

	it("should have a 400 error on modifier endpoint call and employee not valid", async () => {
		const res = await request.post(
			"/api/modifier/SAL1?name=doe&lastname=john&salary=-10&level=4",
		);
		expect(res.status).toBe(400);
		expect(res.text).toEqual("Le salaire doit être un nombre positif");
	});

	it("should update employee on modifier endpoint call", async () => {
		const res = await request.post(
			"/api/modifier/SAL1?name=DURAND&lastname=Pierre&salary=333&level=2",
		);
		expect(res.status).toBe(200);
	});

	it("should have a 400 error on supprimer endpoint call without id", async () => {
		const res = await request.delete("/api/supprimer");
		expect(res.status).toBe(400);
		expect(res.text).toEqual("Le salarié n'a pas été trouvé");
	});

	it("should delete an employee on supprimer endpoint call", async () => {
		const res = await request.delete("/api/supprimer?id=SAL1");
		expect(res.status).toBe(200);
		expect(res.text).toEqual("Le salarié a bien été supprimé");
	});

	it("should have a 401 error on  deleteall without Authorization", async () => {
		const res = await request.delete("/api/deleteall");
		expect(res.status).toBe(401);
	});

	it("should have a 401 error on  deleteall without Authorization", async () => {
		const res = await request.delete("/api/deleteall");
		expect(res.status).toBe(401);
	});

	it("should have a 403 error on  deleteall with bad Authorization", async () => {
		const res = await request
			.delete("/api/deleteall")
			.set("Authorization", "badToken"); 
		expect(res.status).toBe(403);
	});

	it("should have a 403 error on  deleteall with bad Authorization", async () => {
		const res = await request
			.delete("/api/deleteall")
			.set("Authorization", "badToken"); 
		expect(res.status).toBe(403);
	});

	it("should delete all employees on datatest endpoint call", async () => {
		const res = await request
			.delete("/api/deleteall")
			.set("Authorization", "monTokenSecret123"); 		
		expect(res.status).toBe(200);

		const all = await request.get("/api/rechercher?mode=all");
		expect(all.body).toHaveLength(0);
	});

	it("should restore employees data on datatest endpoint call", async () => {
		const reset = await request
			.post("/api/datatest")
			.set("Authorization", "monTokenSecret123"); 
		expect(reset.status).toBe(201);

		const all2 = await request.get("/api/rechercher?mode=all");
		expect(all2.body).toHaveLength(2);
	});
});
