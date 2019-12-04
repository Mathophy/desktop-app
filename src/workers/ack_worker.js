import uuidv4 from 'uuid/v4'
import BaseWorker from './base_worker'
import jobDao from '@/dao/job_dao'
import Vue from 'vue'

class AckWorker extends BaseWorker {
  async doWork() {
    await this.sendAckMessages()
    await this.sendRecallMessages()
  }

  async sendAckMessages() {
    const jobs = jobDao.findAckJobs()
    if (jobs.length <= 0) {
      return
    }
    const messages = jobs.map(function(item) {
      return JSON.parse(item.blaze_message)
    })
    const blazeMessage = {
      id: uuidv4(),
      action: 'ACKNOWLEDGE_MESSAGE_RECEIPTS',
      params: {
        messages: messages
      }
    }
    await Vue.prototype.$blaze.sendMessagePromise(blazeMessage)
    jobDao.delete(jobs)
  }

  async sendRecallMessages() {
    const job = jobDao.findRecallJob()
    if (!job) {
      return
    }

    const userId = JSON.parse(localStorage.getItem('account')).user_id
    const blazeMessage = {
      id: uuidv4(),
      action: 'CREATE_MESSAGE',
      params: {
        category: 'MESSAGE_RECALL',
        conversation_id: job.conversation_id,
        data: job.blaze_message,
        message_id: uuidv4(),
        recipient_id: userId,
        session_id: localStorage.primarySessionId
      }
    }
    await Vue.prototype.$blaze.sendMessagePromise(blazeMessage)
    jobDao.deleteById(job.job_id)
  }
}

export default new AckWorker()
