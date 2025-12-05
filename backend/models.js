const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true, // Allow null for existing users, but we should enforce it for new ones
    unique: true,
    validate: {
      isEmail: true
    }
  },
  gender: {
    type: DataTypes.STRING, // 'male', 'female', 'other'
    allowNull: true,
    defaultValue: 'other'
  }
});

const History = sequelize.define('History', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  movieId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING
  },
  poster_path: {
    type: DataTypes.STRING
  },
  backdrop_path: {
    type: DataTypes.STRING
  },
  watchedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  durationWatched: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  runtime: {
    type: DataTypes.INTEGER
  },
  vote_average: {
    type: DataTypes.FLOAT
  },
  release_date: {
    type: DataTypes.STRING
  }
}, {
  indexes: [
    {
      unique: false,
      fields: ['userId']
    },
    {
      unique: false,
      fields: ['movieId']
    },
    {
      unique: false,
      fields: ['userId', 'movieId']
    }
  ]
});

const View = sequelize.define('View', {
  movieId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

const Watchlist = sequelize.define('Watchlist', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  movieId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  addedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['userId', 'movieId']
    }
  ]
});

// ... existing code ...
const Otp = sequelize.define('Otp', {
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

// Relationships
User.hasMany(History, { foreignKey: 'userId' });
// ... existing code ...
History.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Watchlist, { foreignKey: 'userId' });
Watchlist.belongsTo(User, { foreignKey: 'userId' });

module.exports = { User, History, View, Watchlist, Otp, sequelize };
