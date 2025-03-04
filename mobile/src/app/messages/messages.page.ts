import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { DoctorService } from '../services/doctor.service';
import { IonContent, ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
  standalone: false,
})
export class MessagesPage implements OnInit, OnDestroy {
  @ViewChild(IonContent) content: IonContent | undefined;
  messages: any[] = [];
  newMessage: string = '';
  otherUserId: number | null = null;
  otherUserName: string = ''; // New property for the other user's name
  currentUser: any;
  loading: boolean = false;
  private socket: Socket;

  constructor(
    private authService: AuthService,
    private doctorService: DoctorService,
    private toastController: ToastController,
    private route: ActivatedRoute
  ) {
    const token = this.authService.getToken();
    console.log('Token for WebSocket:', token);
    this.socket = io('http://localhost:5000', {
      auth: { token: token }
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
      if (this.currentUser?.id) {
        this.socket.emit('join', this.currentUser.id, { token: token });
      }
    });

    this.socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
    });

    this.socket.on('error', (data) => {
      console.error('WebSocket error:', data);
      this.presentToast(data.message, 'danger');
    });

    this.socket.on('new_message', (message) => {
      console.log('New message received:', message);
      if (
        (message.sender_id === this.otherUserId && message.receiver_id === this.currentUser?.id) ||
        (message.sender_id === this.currentUser?.id && message.receiver_id === this.otherUserId)
      ) {
        if (!this.messages.some(m => m.id === message.id)) {
          this.messages.push(message);
          this.messages = [...this.messages];
          this.scrollToBottom();
        }
      }
    });
  }

  ngOnInit() {
    this.currentUser = this.authService.getUser();
    console.log('Current user:', this.currentUser);
    this.route.queryParams.subscribe(params => {
      this.otherUserId = params['user_id'] ? parseInt(params['user_id'], 10) : null;
      console.log('Other user ID:', this.otherUserId);
      if (this.otherUserId) {
        this.loadMessages();
        this.loadOtherUserName();
        if (this.socket.connected) {
          this.socket.emit('join', this.currentUser.id, { token: this.authService.getToken() });
        }
      }
    });
  }

  ngOnDestroy() {
    this.socket.disconnect();
  }

  loadMessages() {
    if (!this.otherUserId) return;
    this.loading = true;
    this.doctorService.getMessages(this.otherUserId).subscribe({
      next: (data) => {
        this.messages = data;
        this.loading = false;
        this.scrollToBottom();
        this.markAsRead();
      },
      error: (err) => {
        console.error('Error loading messages:', err);
        this.presentToast('Failed to load messages', 'danger');
        this.loading = false;
      }
    });
  }

  loadOtherUserName() {
    if (!this.otherUserId) return;
    console.log('Fetching name for user ID:', this.otherUserId);
    this.doctorService.getUserProfile(this.otherUserId).subscribe({
      next: (user) => {
        this.otherUserName = `${user.first_name} ${user.last_name}`;
        console.log('Other user name:', this.otherUserName);
      },
      error: (err) => {
        console.error('Error fetching other user name:', err);
        this.otherUserName = 'Unknown User';
        this.presentToast('Failed to load user name', 'warning');
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim()) {
      this.presentToast('Message cannot be empty', 'warning');
      return;
    }
    if (!this.otherUserId) {
      this.presentToast('No recipient selected', 'warning');
      return;
    }

    console.log('Sending message to:', this.otherUserId);
    this.doctorService.sendMessage(this.otherUserId, this.newMessage).subscribe({
      next: () => {
        this.newMessage = '';
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Send message error:', err);
        this.presentToast('Failed to send message', 'danger');
      }
    });
  }

  markAsRead() {
    if (this.otherUserId) {
      this.doctorService.markMessagesRead(this.otherUserId).subscribe({
        error: (err) => console.error('Error marking messages as read:', err)
      });
    }
  }

  scrollToBottom() {
    setTimeout(() => this.content?.scrollToBottom(300), 100);
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}