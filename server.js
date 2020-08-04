const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require("console.table");
const { start } = require("repl");
const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "employees",
});

connection.connect(function (err) {
  if (err) throw err;
  startQuestions();
});

function startQuestions() {
  inquirer
    .prompt([
      {
        type: "rawlist",
        name: "initialQ",
        message: "What would you like to do?",
        choices: [
          "Add a department",
          "Add a role",
          "Add an employee",
          "View employee by department",
          "View employee by role",
          "View all employees",
          "Update employee roles",
        ],
      },
    ])
    .then(function (answers) {
      switch (answers.action) {
        case "Add a department":
          addDepartment();
          break;
        case "Add a role":
          addRole();
          break;
        case "Add an employee":
          addEmployee();
          break;
        case "View employee by department":
          viewByDepartment();
          break;
        case "View employee by role":
          viewByRole();
          break;
        case "View all employees":
          viewAll();
          break;
        case "Update employee roles":
          updateRoles();
          break;
      }
    });
}

function addDepartment() {
  console.log("adding a department");
  inquirer
    .prompt({
      type: "input",
      name: "departmentName",
      message: "What department would you like to add?",
    })
    .then(function (answer) {
      const query = "INSERT INTO department SET ?";
      connection.query(query, { name: answer.name }, function (err) {
        if (err) throw err;

        console.log("You have successfully added a department.");
      });
    });
}

function addRole() {
  inquirer
    .prompt([
      {
        type: "input",
        name: "roleName",
        message: "What role would you like to add?",
      },
      {
        type: "input",
        name: "roleSalary",
        message: "What is this position's starting salary?",
      },
      {
        type: "rawlist",
        name: "departmentOfRole",
        message: "Which department does this role belong in?",
        choices: [
          connection.query("SELECT * FROM department", function (err) {
            if (err) throw err;
          }),
        ],
      },
    ])
    .then(function (answers) {});
}
