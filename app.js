const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

initializeDBAndServer();

const convertTodoCC = (todo) => {
  return {
    id: todo.id,
    todo: todo.todo,
    priority: todo.priority,
    status: todo.status,
    category: todo.category,
    dueDate: todo.due_date,
  };
};

const hasStatusProperties = (status) => {
  status = status.status;
  return status;
};

const hasPriorityProperties = (dbObject) => {
  priority = dbObject.priority;
  return priority;
};

const hasStatusAndPriorityProperties = (dbObject) => {
  status = dbObject.status;
  priority = dbObject.priority;
  return status, priority;
};

app.get("/todos/", async (request, response) => {
  const query = request.query;
  console.log(query);
  const searchedRow = "";
  if (query.status !== undefined) {
    if (
      query.status === "TO DO" ||
      query.status === "IN PROGRESS" ||
      query.status === "DONE"
    ) {
      const status = query.status;
      const selectedTodosQuery = `SELECT * FROM todo
            WHERE status = '${status}';`;
      const dbResponse = await db.all(selectedTodosQuery);
      response.send(dbResponse.map((eachItem) => convertTodoCC(eachItem)));
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (query.priority !== undefined) {
    if (
      query.priority === "HIGH" ||
      query.priority === "MEDIUM" ||
      query.priority === "LOW"
    ) {
      const priority = query.priority;
      const selectedTodosQuery = `SELECT * FROM todo
            WHERE priority = '${priority}';`;
      const dbResponse = await db.all(selectedTodosQuery);
      response.send(dbResponse.map((eachItem) => convertTodoCC(eachItem)));
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (query.status !== undefined && query.priority !== undefined) {
    if (
      (query.status === "TO DO" ||
        query.status === "IN PROGRESS" ||
        query.status === "DONE") &&
      (query.priority === "HIGH" ||
        query.priority === "MEDIUM" ||
        query.priority === "LOW")
    ) {
      hasStatusAndPriorityProperties(query);
      const selectTodoQuery = `SELECT * FROM todo 
          WHERE status = '${query.status}' and
          priority = '${query.priority}'`;
      const dbResponse = await db.all(selectedTodosQuery);
      response.send(dbResponse.map((eachItem) => convertTodoCC(eachItem)));
    } else {
      response.status(400);
      response.send("Invalid Status and Priority");
    }
  } else if (query.search_q !== undefined) {
    const todo = query.search_q;
    const selectedTodoQuery = `SELECT * FROM todo
      WHERE todo LIKE '%${todo}%';`;
    const dbResponse = await db.all(selectedTodoQuery);
    console.log(dbResponse.length);
    if (dbResponse.length !== 0) {
      response.send(dbResponse.map((eachItem) => convertTodoCC(eachItem)));
    } else {
      response.send("Invalid Todo");
      response.status(400);
    }
  } else if (query.category !== undefined) {
    const category = query.category;
    const selectedTodoQuery = `SELECT * FROM todo
      WHERE category LIKE '${category}';`;
    const dbResponse = await db.all(selectedTodoQuery);
    console.log(dbResponse.length);
    if (dbResponse.length !== 0) {
      response.send(dbResponse.map((eachItem) => convertTodoCC(eachItem)));
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (query.category !== undefined && query.status !== undefined) {
    const category = query.category;
    const status = query.status;
    const selectedTodoQuery = `SELECT * FROM todo
      WHERE category='${category}'
      AND status = '${status}';`;
    const dbResponse = await db.all(selectedTodoQuery);
    console.log(dbResponse.length);
    if (dbResponse.length !== 0) {
      response.send(dbResponse.map((eachItem) => convertTodoCC(eachItem)));
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (query.category !== undefined && query.priority !== undefined) {
    const category = query.category;
    const priority = query.priority;
    const selectedTodoQuery = `SELECT * FROM todo
      WHERE category='${category}'
      AND priority = '${priority}';`;
    const dbResponse = await db.all(selectedTodoQuery);
    console.log(dbResponse.length);
    if (dbResponse.length !== 0) {
      response.send(dbResponse.map((eachItem) => convertTodoCC(eachItem)));
    } else {
      response.status(400);
      response.send("Invalid Category");
    }
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  console.log(todoId);
  const selectedUserQuery = `SELECT * FROM todo 
    WHERE id = ${todoId};`;
  const dbResponse = await db.get(selectedUserQuery);
  response.send(convertTodoCC(dbResponse));
});

app.get("/agenda/", async (request, response) => {
  const query = request.query;
  const datesQ = query.date;
  let dbResponse = "";
  const date = format(new Date(datesQ), "yyyy-MM-dd");
  console.log(date === isValid(new Date()));
  if (isValid(new Date(date))) {
    const selectedTodoQuery = `SELECT * FROM todo
  WHERE due_date = "${date}";`;
    dbResponse = await db.all(selectedTodoQuery);
    console.log(dbResponse);
  }
  if (dbResponse.length !== 0) {
    response.send(dbResponse.map((eachItem) => convertTodoCC(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const formattedDate = format(new Date(request.body.dueDate), "yyyy-MM-dd");
  console.log(isValid(new Date(dueDate)));
  let row = "";
  if (priority !== "HIGH" && priority !== "LOW" && priority !== "MEDIUM") {
    row = "Priority";
  } else if (
    status !== "TO DO" &&
    status !== "DONE" &&
    status !== "IN PROGRESS"
  ) {
    row = "Status";
  } else if (
    category !== "HOME" &&
    category !== "WORK" &&
    category !== "LEARNING"
  ) {
    row = "Category";
  } else if (formattedDate !== isValid(new Date(dueDate))) {
    console.log("set");
    row = "Due Date";
  }
  console.log(row);
  if (
    row !== "Priority" &&
    row !== "Status" &&
    row !== "Category" &&
    row !== "Due Date"
  ) {
    const createTodoQUery = `INSERT INTO todo(id,
                todo,priority,status,category,due_date)
                VALUES (${id},
                    '${todo}',
                    '${priority}',
                    '${status}',
                    '${category}',
                    '${formattedDate}')`;
    const dbResponse = await db.run(createTodoQUery);
    response.send("Todo Successfully Added");
  } else {
    response.status(400);
    response.send(`Invalid Todo ${row}`);
  }
});

app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const updatedProperty = request.body;
  let UpdatedRow = "";
  if (updatedProperty.status !== undefined) {
    if (
      updatedProperty.status === "TO DO" ||
      updatedProperty.status === "DONE" ||
      updatedProperty.status === "IN PROGRESS"
    ) {
      updatedRow = "Status";
      status = updatedProperty.status;
      const updateQuery = `UPDATE todo SET
            status = '${status}' 
            WHERE id= ${todoId};`;
      const dbResponse = await db.run(updateQuery);
      if (updatedRow !== undefined) {
        response.send(`${updatedRow} Updated`);
      } else {
        response.status(400);
        response.send(`Invalid Todo ${updatedRow}`);
      }
    }
  } else if (updatedProperty.todo !== undefined) {
    updatedRow = "Todo";
    todo = updatedProperty.todo;
    const updateQuery = `UPDATE todo SET
            todo = '${todo}' 
            WHERE id= ${todoId};`;
    const dbResponse = await db.run(updateQuery);
    if (updatedRow !== undefined) {
      response.send(`${updatedRow} Updated`);
    } else {
      response.status(400);
      response.send(`Invalid Todo ${updatedRow}`);
    }
  } else if (updatedProperty.priority !== undefined) {
    updatedRow = "Priority";
    priority = updatedProperty.priority;
    const updateQuery = `UPDATE todo SET
            priority = '${priority}' 
            WHERE id= ${todoId};`;
    const dbResponse = await db.run(updateQuery);
  } else if (updatedProperty.category !== undefined) {
    updatedRow = "Category";
    category = updatedProperty.category;
    const updateQuery = `UPDATE todo SET
            category = '${category}' 
            WHERE id= ${todoId};`;
    const dbResponse = await db.run(updateQuery);
    if (updatedRow !== undefined) {
      response.send(`${updatedRow} Updated`);
    } else {
      response.status(400);
      response.send(`Invalid Todo ${updatedRow}`);
    }
  } else if (updatedProperty.dueDate !== undefined) {
    updatedRow = "Due Date";
    dueDate = updatedProperty.dueDate;
    console.log(dueDate);
    const date = format(new Date(dueDate), "yyyy-MM-dd");
    if (date === isValid(new Date(dueDate))) {
      const updateQuery = `UPDATE todo SET
            due_date = '${date}' 
            WHERE id= ${todoId};`;
      const dbResponse = await db.run(updateQuery);
      if (updatedRow !== undefined) {
        response.send(`${updatedRow} Updated`);
      } else {
        response.status(400);
        response.send(`Invalid ${updatedRow}`);
      }
    } else {
      response.status(400);
      response.send(`Invalid ${updatedRow}`);
    }
  }
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo
    WHERE id = ${todoId};`;
  const dbResponse = await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
