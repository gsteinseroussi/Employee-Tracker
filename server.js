const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require("console.table");
const { start } = require("repl");
const { connect } = require("http2");
const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "amADeus#10",
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
          startQuestions();
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
        connection.query(
          "SELECT * FROM department WHERE department.name = ?",
          [answers.departmentOfRole],
          function (err, result) {
            if (err) throw err;

            const string = JSON.stringify(result);

            const json = JSON.parse(string);

            const departmentId = parseInt(json[0].id);

            connection.query(
              "INSERT INTO role SET ?",
              {
                title: answers.roleName,
                salary: answers.roleSalary,
                department_id: departmentId,
              },
              function (err, res) {
                if (err) throw err;

                console.log("You have successfully added a role");
                startQuestions();
              }
            );
          }
        );
      });
  });
}

function addEmployee() {
  connection.query("SELECT * FROM role", (err, res) => {
    if (err) throw err;
    const role = [];
    const string = JSON.stringify(res);
    const json = JSON.parse(string);
    json.forEach((index) => role.push(index.title));

    inquirer
      .prompt([
        {
          type: "input",
          name: "employeeFirstName",
          message: "What is your employee's first name?",
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
        connection.query(
          "SELECT * FROM role WHERE role.title = ?",
          [answers.job],
          function (err, result) {
            if (err) throw err;

            const string = JSON.stringify(result);

            const json = JSON.parse(string);

            const roleId = parseInt(json[0].id);

            let manId;
            if (answers.manager === false) {
              connection.query(
                `SELECT * FROM employee WHERE employee.role_id = ${roleId} AND employee.manager_id IS NULL`,
                function (err, results) {
                  if (err) throw err;
                  console.log(results);
                  const string = JSON.stringify(results);
                  const json = JSON.parse(string);
                  manId = parseInt(json[0].id);
                  console.log(manId);

                  connection.query(
                    "INSERT INTO employee SET ?",
                    {
                      first_name: answers.employeeFirstName,
                      last_name: answers.employeeLastName,
                      role_id: roleId,
                      manager_id: manId,
                    },
                    function (err, res) {
                      if (err) throw err;

                      console.log("You have successfully added an employee");
                      startQuestions();
                    }
                  );
                }
              );
            } else {
              manId = null;
            }
          }
        );
      });
  });
}

function viewByDepartment() {
  let department;
  connection.query("SELECT * FROM department", (err, res) => {
    if (err) throw err;
    department = res;

    inquirer
      .prompt([
        {
          type: "rawlist",
          name: "department",
          message: "Which department would you like to view?",
          choices: department,
        },
      ])
      .then(function (answer) {
        let chosenDepartment = answer.department;
        console.log(`${chosenDepartment} Employees:`);
        connection.query(
          "SELECT * FROM department WHERE department.name = ?",
          [answer.department],
          // role.department_id = department.${answer.department}.id,
          (err, res) => {
            if (err) throw err;
            const string = JSON.stringify(res);
            const json = JSON.parse(string);
            const departmentId = json[0].id;

            connection.query(
              "SELECT * FROM role WHERE role.department_id = ?",
              [departmentId],
              (err, res) => {
                if (err) throw err;

                const string = JSON.stringify(res);
                const json = JSON.parse(string);
                const roleId = [];
                json.forEach((obj) => {
                  roleId.push(obj.id);
                });

                roleId.forEach((id) => {
                  connection.query(
                    "SELECT * FROM employee WHERE employee.role_id = ?",
                    [id],
                    (err, res) => {
                      if (err) throw err;

                      const string = JSON.stringify(res);
                      const json = JSON.parse(string);

                      json.forEach((emp) => {
                        console.log(emp.first_name, emp.last_name);
                      });
                    }
                  );
                });
              }
            );
          }
        );
      });
  });
}

function viewByRole() {}

function viewAll() {}

function updateRoles() {}
