const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testRoutes() {
  try {
    // Test API connection
    const testResponse = await axios.get(`${API_URL}/test`);
    console.log('API Test:', testResponse.data);

    // Get all employees
    const employeesResponse = await axios.get(`${API_URL}/employees`);
    console.log('Employees count:', employeesResponse.data.length);

    // Try to get first employee
    if (employeesResponse.data.length > 0) {
      const firstEmployee = employeesResponse.data[0];
      const singleEmployee = await axios.get(`${API_URL}/employees/${firstEmployee._id}`);
      console.log('Single employee:', singleEmployee.data);
    }

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testRoutes(); 