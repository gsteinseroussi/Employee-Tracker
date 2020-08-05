const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require("console.table");
const { start } = require("repl");
const { connect } = require("http2");
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
      switch (answers.initialQ) {
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
      const query = connection.query(
        "INSERT INTO department SET ?",
        {
          name: answer.departmentName,
        },
        function (err, res) {
          if (err) throw err;

          console.log("You have successfully added a department");
        }
      );
    });
}

function addRole() {
  let department;
  connection.query("SELECT * FROM department", (err, res) => {
    if (err) throw err;
    department = res;

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
          choices: department,
        },
      ])
      .then(function (answers) {
        let departmentId;
        connection.query(
          "SELECT * FROM department WHERE name = ?",
          [answers.departmentOfRole],
          function (err, result) {
            if (err) throw err;
            departmentId = parseInt(result.id);
            console.log(departmentId);
          }
        );

        connection.query(
          "INSERT INTO role SET ?",
          {
            name: answers.roleName,
            salary: answers.roleSalary,
            department_id: departmentId,
          },
          function (err, res) {
            if (err) throw err;

            console.log("You have successfully added a role");
          }
        );
      });
  });
}

function addEmployee() {
  let role;
  connection.query("SELECT * FROM role", (err, res) => {
    if (err) throw err;

    role = res.name;

    inquirer
      .prompt([
        {
          type: "input",
          name: "employeeFirstName",
          message: "What is your employee's first name??",
        },
        {
          type: "input",
          name: "employeeLastName",
          message: "What is your employee's last name?",
        },
        {
          type: "rawlist",
          name: "job",
          message: "What is their position?",
          choices: role,
        },
        {
          type: "confirm",
          name: "manager",
          message: "Are they a manager?",
        },
      ])
      .then(function (answers) {
        const query = connection.query(
          "INSERT INTO employee SET ?",
          {
            first_name: answers.employeeFirstName,
            last_name: answers.employeeLastName,
            role_id: answers.job.id,
            manager_id: answers.choices,
          },
          function (err, res) {
            if (err) throw err;

            console.log("You have successfully added an employee");
          }
        );
      });
  });
}
