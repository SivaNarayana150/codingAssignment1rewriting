const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();

app.use(express.json());

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");

let db = "";

const initializeDatabaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server running successfully at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB error ${e.message}`);
    process.exit(1);
  }
};
initializeDatabaseAndServer();

// API 1

const convertDatabaseToResponse = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "", category } = request.query;
  let statusIncludes = ["TO DO", "IN PROGRESS", "DONE"];
  let priorityIncludes = ["HIGH", "MEDIUM", "LOW"];
  let categoryIncludes = ["WORK", "HOME", "LEARNING"];
  //scenario 3
  if (
    status !== undefined &&
    priority !== undefined &&
    category === undefined
  ) {
    if (statusIncludes.includes(status)) {
      if (priorityIncludes.includes(priority)) {
        const fetchStatusPriorityQuery = `SELECT * FROM todo WHERE status='${status}' AND priority='${priority}';`;
        const responseStatusPriority = await db.all(fetchStatusPriorityQuery);
        response.send(
          responseStatusPriority.map((each) => convertDatabaseToResponse(each))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }

  // scenario 1

  if (
    status !== undefined &&
    priority === undefined &&
    category === undefined
  ) {
    if (statusIncludes.includes(status)) {
      const fetchStatusQuery = `SELECT * FROM todo WHERE status='${status}';`;
      const responseResult = await db.all(fetchStatusQuery);
      response.send(
        responseResult.map((each) => convertDatabaseToResponse(each))
      );
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }

  //scenario 2

  if (
    priority !== undefined &&
    status === undefined &&
    category === undefined
  ) {
    if (priorityIncludes.includes(priority)) {
      const fetchPriorityQuery = `SELECT * FROM todo WHERE priority='${priority}';`;
      const resultResponsePriority = await db.all(fetchPriorityQuery);
      response.send(
        resultResponsePriority.map((each) => convertDatabaseToResponse(each))
      );
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }

  //scenario 5

  if (category !== undefined && status !== undefined) {
    if (categoryIncludes.includes(category)) {
      if (statusIncludes.includes(status)) {
        const fetchStatusCategoryQuery = `SELECT * FROM todo WHERE status='${status}' AND category='${category}';`;
        const responseStatusCategory = await db.all(fetchStatusCategoryQuery);

        response.send(
          responseStatusCategory.map((each) => convertDatabaseToResponse(each))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
  //Scenario 4

  if (
    category === undefined &&
    priority === undefined &&
    status === undefined
  ) {
    const fetchSearch_qQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%";`;
    const responseSearch_q = await db.all(fetchSearch_qQuery);
    response.send(
      responseSearch_q.map((each) => convertDatabaseToResponse(each))
    );
  }

  //scenario 6

  if (
    category !== undefined &&
    status === undefined &&
    priority === undefined
  ) {
    if (categoryIncludes.includes(category)) {
      const fetchCategoryQuery = `SELECT * FROM todo WHERE category='${category}';`;
      const resultResponseCategory = await db.all(fetchCategoryQuery);
      response.send(
        resultResponseCategory.map((each) => convertDatabaseToResponse(each))
      );
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }

  //Scenario  7

  if (category !== undefined && priority !== undefined) {
    if (categoryIncludes.includes(category)) {
      if (priorityIncludes.includes(priority)) {
        const fetchPriorityCategoryQuery = `SELECT * FROM todo WHERE priority='${priority}' AND category='${category}';`;
        const responsePriorityCategory = await db.all(
          fetchPriorityCategoryQuery
        );

        response.send(
          responsePriorityCategory.map((each) =>
            convertDatabaseToResponse(each)
          )
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
});

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const fetchTodoByTodoIdQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const responseTodoByTodoId = await db.get(fetchTodoByTodoIdQuery);
  response.send(convertDatabaseToResponse(responseTodoByTodoId));
});

//API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const requestQuery = `SELECT * FROM todo WHERE due_date='${newDate}';`;
    const ResponseResult = await db.all(requestQuery);
    response.send(
      ResponseResult.map((each) => convertDatabaseToResponse(each))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  let statusIncludes = ["TO DO", "IN PROGRESS", "DONE"];
  let priorityIncludes = ["HIGH", "MEDIUM", "LOW"];
  let categoryIncludes = ["WORK", "HOME", "LEARNING"];

  if (status !== undefined) {
    if (statusIncludes.includes(status)) {
      if (priorityIncludes.includes(priority)) {
        if (categoryIncludes.includes(category)) {
          if (isMatch(dueDate, "yyyy-MM-dd")) {
            const newDate = format(new Date(dueDate), "yyyy-MM-dd");
            const createTodoQuery = `INSERT INTO todo (id,todo,priority,status,category,due_date)
                                                VALUES(${id},
                                                    '${todo}',
                                                    '${priority}',
                                                    '${status}',
                                                    '${category}',
                                                    '${newDate}') ;
                                                    `;

            await db.run(createTodoQuery);
            response.send("Todo Successfully Added");
          } else {
            response.status(400);
            response.send("Invalid Due Date");
          }
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }
});

//api 5

app.put("/todos/:todoId/", async (request, response) => {
  const { status, priority, todo, category, dueDate } = request.body;
  const { todoId } = request.params;
  let statusIncludes = ["TO DO", "IN PROGRESS", "DONE"];
  let priorityIncludes = ["HIGH", "MEDIUM", "LOW"];
  let categoryIncludes = ["WORK", "HOME", "LEARNING"];

  //SCenario 1

  if (status !== undefined) {
    if (statusIncludes.includes(status)) {
      const upDateStatus = `UPDATE todo SET status='${status}' WHERE id=${todoId};`;
      await db.run(upDateStatus);
      response.send("Status Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }

  //SCenario 2

  if (priority !== undefined) {
    if (priorityIncludes.includes(priority)) {
      const upDatePriority = `UPDATE todo SET priority='${priority}' WHERE id=${todoId};`;
      await db.run(upDatePriority);
      response.send("Priority Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }

  //SCenario 3

  if (todo !== undefined) {
    const upDateTodo = `UPDATE todo SET todo='${todo}' WHERE id=${todoId};`;
    await db.run(upDateTodo);
    response.send("Todo Updated");
  }

  //SCenario 4

  if (category !== undefined) {
    if (categoryIncludes.includes(category)) {
      const upDateCategory = `UPDATE todo SET category='${category}' WHERE id=${todoId};`;
      await db.run(upDateCategory);
      response.send("Category Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }

  //SCenario 5
  if (dueDate !== undefined) {
    if (isMatch(dueDate, "yyyy-MM-dd")) {
      const upDateDueDate = `UPDATE todo SET due_date='${dueDate}' WHERE id=${todoId};`;
      await db.run(upDateDueDate);
      response.send("Due Date Updated");
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const fetchTodoByTodoIdQuery = `DELETE  FROM todo WHERE id=${todoId};`;
  const responseTodoByTodoId = await db.run(fetchTodoByTodoIdQuery);
  response.send("Todo Deleted");
});

module.exports = app;
