/** @jsxImportSource @kitajs/html */
import type { CollectedAttachment } from '../../types';
import { EmptyState } from '../shared/EmptyState';

export interface AttachmentsProps {
  attachments: CollectedAttachment[];
}

function ScreenshotAttachment({ attachment }: { attachment: CollectedAttachment }) {
  if (!attachment.relativePath) {
    return (
      <div class="attachment-chip attachment-chip--missing" safe>
        Missing screenshot · {attachment.name}
      </div>
    );
  }

  return (
    <figure class="attachment-card attachment-card--screenshot">
      <img
        src={attachment.relativePath}
        alt={attachment.name}
        loading="lazy"
        onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'attachment-chip attachment-chip--missing',textContent:'Missing file'}))"
      />
      <figcaption safe>{attachment.name}</figcaption>
    </figure>
  );
}

function VideoAttachment({ attachment }: { attachment: CollectedAttachment }) {
  if (!attachment.relativePath) {
    return (
      <div class="attachment-chip attachment-chip--missing" safe>
        Missing video · {attachment.name}
      </div>
    );
  }

  return (
    <figure class="attachment-card attachment-card--video">
      <video controls>
        <source src={attachment.relativePath} type={attachment.contentType} />
      </video>
      <figcaption safe>{attachment.name}</figcaption>
    </figure>
  );
}

function TraceAttachment({ attachment }: { attachment: CollectedAttachment }) {
  if (!attachment.relativePath) {
    return (
      <span class="attachment-chip attachment-chip--missing" safe>
        Missing trace · {attachment.name}
      </span>
    );
  }

  return (
    <a
      class="attachment-chip attachment-chip--trace"
      href={attachment.relativePath}
      target="_blank"
      rel="noopener"
      safe
    >
      Trace · {attachment.name}
    </a>
  );
}

function OtherAttachment({ attachment }: { attachment: CollectedAttachment }) {
  if (!attachment.relativePath) {
    return (
      <span class="attachment-chip attachment-chip--missing" safe>
        {attachment.name}
      </span>
    );
  }

  return (
    <a
      class="attachment-chip"
      href={attachment.relativePath}
      target="_blank"
      rel="noopener"
      download=""
      safe
    >
      {attachment.name}
    </a>
  );
}

export function Attachments({ attachments }: AttachmentsProps) {
  if (attachments.length === 0) {
    return <EmptyState message="No attachments recorded." />;
  }

  const screenshots = attachments.filter((a) => a.kind === 'screenshot');
  const videos = attachments.filter((a) => a.kind === 'video');
  const traces = attachments.filter((a) => a.kind === 'trace');
  const others = attachments.filter((a) => a.kind === 'other');

  const mediaList = [...screenshots, ...videos];
  const chipList = [...traces, ...others];

  return (
    <>
      {mediaList.length > 0 && (
        <div class="attachment-grid">
          {mediaList.map((a) =>
            a.kind === 'screenshot' ? (
              <ScreenshotAttachment attachment={a} />
            ) : (
              <VideoAttachment attachment={a} />
            ),
          )}
        </div>
      )}
      {chipList.length > 0 && (
        <div class="attachment-chips">
          {chipList.map((a) =>
            a.kind === 'trace' ? (
              <TraceAttachment attachment={a} />
            ) : (
              <OtherAttachment attachment={a} />
            ),
          )}
        </div>
      )}
    </>
  );
}
