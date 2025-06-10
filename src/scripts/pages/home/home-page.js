import StoryCard from '../../components/story-card';
import HomePresenter from './home-presenter';
import LightboxManager from '../../components/lightbox-manager';
import Swal from "sweetalert2";
import { subscribe } from '../../utils/notification';
import { isServiceAvailable } from '../../utils';

export default class HomePage {
  #presenter;
  #storiesContainer;
  #loadingIndicator = null;
  #globalLoadingOverlay = null;
  #lightboxManager;
  #skipLinkHandler = null;
  #clearCache = null;

  async render() {
    return `
      <section class="container view-transition-content">
        <div id="globalLoadingOverlay" class="global-loading-overlay" aria-label="Loading content">
          <div class="loading-spinner"></div>
          <div class="loading-text">Memuat konten...</div>
        </div>
        <div class="heading--container" aria-label="Heading container">
          <h1 aria-label="Homepage">Homepage</h1>
          <p aria-label="Deskripsi homepage" >Lihat semua Story yang telah dibuat!</p>
        </div>
        <div id="delete-cache-container">
          <button id="delete-btn" aria-label="Tombol hapus local Story">
            <svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 24 24">
              <path fill="currentColor" d="M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5t.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5t-.288.713T19 6v13q0 .825-.587 1.413T17 21zm3-4q.425 0 .713-.288T11 16V9q0-.425-.288-.712T10 8t-.712.288T9 9v7q0 .425.288.713T10 17m4 0q.425 0 .713-.288T15 16V9q0-.425-.288-.712T14 8t-.712.288T13 9v7q0 .425.288.713T14 17" />
            </svg>
            <span>
              Hapus Local Story!
            </span>
          </button>
          <button id="notification-btn" aria-label="Tombol Notification">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2a7 7 0 0 0-7 7v3.528a1 1 0 0 1-.105.447l-1.717 3.433A1.1 1.1 0 0 0 4.162 18h15.676a1.1 1.1 0 0 0 .984-1.592l-1.716-3.433a1 1 0 0 1-.106-.447V9a7 7 0 0 0-7-7m0 19a3 3 0 0 1-2.83-2h5.66A3 3 0 0 1 12 21" />
              </svg>
              <span id="notify-txt">Notify Me</span>
          </button>
        </div>
        <div class="stories-container" aria-label="Container story pengguna">
          <div class="loading-indicator" aria-label="Loading memuat cerita">Memuat cerita...</div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#storiesContainer = document.querySelector('.stories-container');
    this.#loadingIndicator = document.querySelector('.loading-indicator');
    this.#globalLoadingOverlay = document.getElementById(
      'globalLoadingOverlay'
    );

    if (!this.#storiesContainer) {
      console.error('DOM stories-container belum ada!');
      return;
    }

    this.#storiesContainer.setAttribute('tabindex', '-1');

    this.#setupSkipLink();

    this.hideLoading();
    this.#lightboxManager = new LightboxManager();
    this.#presenter = new HomePresenter({ view: this });
    try {
      this.showLoading();
      await this.#presenter.init();
    } catch (error) {
      console.error('Error initializing HomePresenter:', error);
      this.showError('GAGAl MEMUAT CERITA');
      this.hideLoading();
    }
    
    this.#clearCache = document.getElementById("delete-btn");
    this.#clearCache.addEventListener("click", async () => {
      try {
        const result = await Swal.fire({
          title:"Apakah Anda ingin menghapus data local Story?",
          text : "Koneksi internet diperlukan untuk mendapatkan data terbaru!",
          icon: "question",
          iconColor: "#cfc100",
          imageAlt: "Question?",
          showCancelButton : true,
          confirmButtonColor : "#469D89",
          cancelButtonColor : "#cf0000",
          confirmButtonText : "Ya",
          cancelButtonText: "Batal"
        });

        if(result.isConfirmed){
          await this.#presenter.clearCache();
          await Swal.fire({
            title : "Data local Story telah terhapus",
            text : "Hubungkan ke internet untuk mendapatkan data terbaru!",
            icon : "success",
            iconColor: "#469D89",
            confirmButtonColor : "#469D89",
          });
        } else {
          console.log('Cache clear cancelled by user.');
        }
      } catch (error) {
        console.error('Error during cache clear process:', error);
        Swal.fire({
          title: "Error!",
          text: "Gagal menghapus cache. Silakan coba lagi.",
          icon: "error"
        });
      }
    });
        
    if (isServiceAvailable()) {
      this.#setUpPushNotification();
    }
  }

  #setupSkipLink() {
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
      if (this.#skipLinkHandler) {
        skipLink.removeEventListener('click', this.#skipLinkHandler);
      }

      this.#skipLinkHandler = (event) => {
        setTimeout(() => {
          if (this.#storiesContainer) {
            const firstStoryCard =
              this.#storiesContainer.querySelector('.story-card');
            const noStoriesMessage = this.#storiesContainer.querySelector('p');

            if (firstStoryCard) {
              firstStoryCard.focus({ preventScroll: true });
            } else if (noStoriesMessage) {
              if (!noStoriesMessage.hasAttribute('tabindex')) {
                noStoriesMessage.setAttribute('tabindex', '-1');
              }
              noStoriesMessage.focus({ preventScroll: true });
            } else {
              this.#storiesContainer.focus({ preventScroll: true });
            }
          }
        }, 0);
      };
      skipLink.addEventListener('click', this.#skipLinkHandler);
    }
  }

  showLoading() {
    if (this.#globalLoadingOverlay) {
      this.#globalLoadingOverlay.style.display = 'flex';
    }

    if (this.#loadingIndicator) {
      this.#loadingIndicator.style.display = 'block';
    }
  }

  hideLoading() {
    if (this.#globalLoadingOverlay) {
      this.#globalLoadingOverlay.style.display = 'none';
    }

    if (this.#loadingIndicator) {
      this.#loadingIndicator.style.display = 'none';
    }
  }

  showStories(stories) {
    if (!this.#storiesContainer) {
      console.error("Element 'stories-container' not found.");
      return;
    }

    if (!stories || stories.length === 0) {
      this.#storiesContainer.innerHTML =
        '<p>Belum ada cerita untuk ditampilkan.</p>';
      return;
    }

    this.#storiesContainer.innerHTML = stories
      .map((story) => new StoryCard(story).render())
      .join('');
  }

  attachStoryCardListeners(stories) {
    const storyCards = document.querySelectorAll('#detailBtn');
    storyCards.forEach((card) => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const storyId = card.dataset.storyId;
        const story = stories.find((s) => s.id === storyId);
        if (story) {
          if (document.startViewTransition) {
            document.startViewTransition(() => {
              this.#lightboxManager.openLightbox(story);
            });
          } else {
            this.#lightboxManager.openLightbox(story);
          }
        }
      });
    });
  }

  showError(message) {
    this.hideLoading();
    console.log(message);
  }
  
  async #setUpPushNotification() {
    const notificationButton = document.getElementById('notification-btn');

    if (notificationButton) {
      notificationButton.addEventListener('click', () => {
        subscribe();
      });
    } 
  }
}
