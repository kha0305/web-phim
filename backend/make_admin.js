const { User, sequelize } = require('./models');

const makeAdmin = async () => {
  const username = process.argv[2];
  
  if (!username) {
    console.log("Please provide a username.");
    console.log("Usage: node make_admin.js <username>");
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true }); // Ensure schema matches models (adds 'role' column if missing)
    console.log('Connection has been established successfully.');
    
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      console.log(`User '${username}' not found.`);
      console.log('Available users:');
      const users = await User.findAll({ attributes: ['username'] });
      users.forEach(u => console.log(` - ${u.username}`));
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();
    
    console.log(`Successfully promoted '${username}' to ADMIN!`);
    console.log(`You can now login as '${username}' and access the Admin Dashboard.`);
  } catch (error) {
    console.error('Unable to connect to the database or update user:', error);
  } finally {
    await sequelize.close();
  }
};

makeAdmin();
