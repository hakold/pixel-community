/**
 * ActionTask 行为任务数据模型
 * 记录玩家当前正在执行的行为（教育/打工/采集）
 */
const mongoose = require('mongoose');

const actionTaskSchema = new mongoose.Schema(
  {
    // 所属玩家
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
      index: true,
    },

    // 行为类型: study | work | mining | woodcut | fishing
    actionType: {
      type: String,
      required: true,
      enum: ['study', 'work', 'mining', 'woodcut', 'fishing'],
    },

    // 行为配置 ID（对应 JSON 配置文件中的 id）
    actionId: {
      type: String,
      required: true,
    },

    // 开始时间
    startTime: {
      type: Date,
      default: Date.now,
    },

    // 持续时长（秒）
    duration: {
      type: Number,
      required: true,
      min: 1,
    },

    // 任务状态
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },

    // 已完成周期数（用于可重复行为）
    completedCycles: {
      type: Number,
      default: 0,
    },

    // 开始时的快照（用于结算时校验）
    startSnapshot: {
      energy: Number,
      mood: Number,
      level: Number,
      education: String,
    },

    // 结算时间
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// 复合索引：按玩家和状态查找
actionTaskSchema.index({ playerId: 1, status: 1 });

module.exports = mongoose.model('ActionTask', actionTaskSchema);
