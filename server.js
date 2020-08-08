const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require("console.table");
const { restoreDefaultPrompts } = require("inquirer");
require("dotenv").config();
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
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
          "View departments",
          "View roles",
          "View all employees",
          "Update employee roles",
          "End app",
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
        case "View departments":
          viewByDepartment();
          break;
        case "View roles":
          viewRoles();
          break;
        case "View all employees":
          viewAll();
          break;
        case "Update employee roles":
          updateRoles();
          break;
        case "End app":
          console.log("Goodbye");
          connection.end();
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
                "SELECT * FROM employee WHERE employee.role_id = ? AND employee.manager_id IS NULL",
                [roleId],
                function (err, results) {
                  if (err) throw err;

                  if (results.length > 0) {
                    console.log(results);
                    manId = parseInt(results[0].id);
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
                }
              );
            } else {
              connection.query(
                "INSERT INTO employee SET ?",
                {
                  first_name: answers.employeeFirstName,
                  last_name: answers.employeeLastName,
                  role_id: roleId,
                  manager_id: null,
                },
                (err, res) => {
                  if (err) throw err;

                  console.log("You have successfully added an employee");

                  startQuestions();
                }
              );
            }
          }
        );
      });
  });
}
async function viewByDepartment() {
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

        connection.query(
          "SELECT * FROM department WHERE department.name = ?",
          [answer.department],
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

                console.log(`${chosenDepartment} Employees:`);
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
                    function (err, res) {
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

function viewRoles() {
  connection.query("SELECT * FROM role", (err, res) => {
    if (err) throw err;
    const roleString = JSON.stringify(res);
    const roleJSON = JSON.parse(roleString);
    const table = cTable.getTable(roleJSON);
    console.log(table);

    startQuestions();
  });
}

function viewAll() {
  connection.query("SELECT * FROM employee", (err, res) => {
    if (err) throw err;
    const emplString = JSON.stringify(res);
    const emplJSON = JSON.parse(emplString);
    const table = cTable.getTable(emplJSON);
    console.log(table);

    startQuestions();
  });
}

function updateRoles() {
  let employees = [];
  let roles = [];

  connection.query("SELECT * FROM role", (err, res) => {
    if (err) throw err;
    res.forEach((role) => roles.push(role.title));

    connection.query("SELECT * FROM employee", (err, res) => {
      if (err) throw err;

      res.forEach((employee) => employees.push(employee.last_name));

      inquirer
        .prompt([
          {
            type: "rawlist",
            name: "updateEmpl",
            message: "Which employee would you like to update?",
            choices: employees,
          },
        ])
        .then((answer) => {
          const stringUpdateEmpl = JSON.stringify(answer.updateEmpl);
          const jsonEmpl = JSON.parse(stringUpdateEmpl);
          connection.query(
            "SELECT * FROM employee WHERE employee.last_name = ?",
            [jsonEmpl],
            (err, res) => {
              if (err) throw err;
              const selectedEmployee = JSON.stringify(res);
              const parseSelectedEmpl = JSON.parse(selectedEmployee);
              console.log(parseSelectedEmpl);

              inquirer
                .prompt([
                  {
                    type: "rawlist",
                    name: "updateRole",
                    message: `What role has ${parseSelectedEmpl[0].first_name} ${parseSelectedEmpl[0].last_name} changed to?`,
                    choices: roles,
                  },
                ])
                .then((answer) => {
                  const stringUpdateRole = JSON.stringify(answer.updateRole);
                  const parsedUpdateRole = JSON.parse(stringUpdateRole);
                  connection.query(
                    "SELECT * FROM role WHERE role.title =?",
                    [parsedUpdateRole],
                    (err, res) => {
                      if (err) throw err;

                      connection.query(
                        "UPDATE employee SET employee.role_id = ? WHERE employee.id = ?",
                        [
                          parseInt(res[0].id),
                          parseInt(parseSelectedEmpl[0].id),
                        ],
                        (err, result) => {
                          if (err) throw err;

                          console.log("Success");
                          startQuestions();
                        }
                      );
                    }
                  );
                });
            }
          );
        });
    });
  });
}
