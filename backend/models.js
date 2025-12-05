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

// Relationships
User.hasMany(History, { foreignKey: 'userId' });
History.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Watchlist, { foreignKey: 'userId' });
Watchlist.belongsTo(User, { foreignKey: 'userId' });

module.exports = { User, History, View, Watchlist, sequelize };
