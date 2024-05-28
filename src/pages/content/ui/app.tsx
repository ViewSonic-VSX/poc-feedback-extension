import { ExtensionMessageStruct } from '@root/src/utility/data_structure';
import { ChirpAIQuizDataKey, GeneralAction, MessageID, MessageSender, StorageID } from '@root/src/utility/static_data';
import { DoDelayAction } from '@root/src/utility/static_utility';
import { RenderHighlightBar } from '@root/src/utility/ui/floating_panels/floating_interface';
import { MouseHelper } from '@root/src/utility/ui/mouse_helper';
import { useEffect } from 'react';
import Browser from 'webextension-polyfill';
import { RuntimePort } from './runtime_port';
import { create_note_row_from_selection } from '../clipboard_tools';
import { NoteRowType } from '@root/src/utility/note_data_struct';
import { ChirpAIQuizType } from '@root/src/utility/static_data_type';

let _cache_quiz_id: string = null;

export default function App() {
  let port_helper = new RuntimePort(StorageID.Notes);
  let mouse_helper = new MouseHelper();
  let highlight_nodes : NoteRowType[] = [];
  let quiz_type_data : ChirpAIQuizType = null;

  const renderHighlightBar = new RenderHighlightBar();
  
        renderHighlightBar.set_callback(() => { 
          CreateToCollectionCallback(highlight_nodes, GetChirpAIQuizData())
          renderHighlightBar.show(false);
          quiz_type_data = null;
        },

        () => {
          PasteToCollectionCallback(highlight_nodes, GetChirpAIQuizData())
          renderHighlightBar.show(false);
          quiz_type_data = null;
        }
      );

  const on_browser_message = function(raw_message: any) {
    const message : ExtensionMessageStruct = raw_message;

  }

  useEffect(() => {
    mouse_helper.register_mouse_up(async (pos) => {
      console.log('mouse up');
        highlight_nodes = await SetHighlightBarPos(renderHighlightBar);
    });

    mouse_helper.register_changes(async () => {
      if (renderHighlightBar.is_show)
          highlight_nodes = await SetHighlightBarPos(renderHighlightBar);
    });

    mouse_helper.register_mouse_down((pos) => {
      renderHighlightBar.mouse_down_event(pos);
    });  

    Browser.runtime.onMessage.addListener(on_browser_message);

    //Dispose
    return () => {
      mouse_helper.dispose();
      Browser.runtime.onMessage.removeListener(on_browser_message);

    };
  }, []);

  return (<div className="vaiue_content">
    {renderHighlightBar.render()}
  </div>);
}

const SetHighlightBarPos = async function (bar: RenderHighlightBar) {
  await DoDelayAction(100);
  const selection  : any = window.getSelection();
  if (selection.rangeCount <= 0) return;

  const getRange = selection.getRangeAt(0); 

  const selectedElement = getRange.startContainer.parentElement;
  var fragment = getRange.cloneContents()
  var imgs = fragment.querySelectorAll('img');
  let images_source: string[] = [];

  _cache_quiz_id = null;
  let parentElement = selectedElement.closest('[data-quiz-id]');
  if (parentElement != null) _cache_quiz_id = parentElement.dataset.quizId;

  for (let i = 0; i < imgs.length; i++) {
    images_source.push(imgs[i].src);
  }
  
  let full_text : string = selection.toString();
      full_text = full_text.trim();

  if (full_text == "") return;

  const selection_bound : DOMRect = getRange.getBoundingClientRect();
  if (selection_bound.left == 0 && selection_bound.right == 0) return;
  
  bar.show(true);
  const bar_bound = bar.get_bound();

  let y_offset = 20;
  let x_pos = selection_bound.left + (selection_bound.width * 0.5) - (bar_bound.width * 0.5);
  let y_pos = (selection_bound.bottom + y_offset);

  bar.set_position(x_pos, y_pos);

  return create_note_row_from_selection(full_text, images_source);
}

const PasteToCollectionCallback = function(nodes: NoteRowType[], chirpai_quiz_type: ChirpAIQuizType) {
  SendTextToBackground(MessageID.ContentPaste, nodes, chirpai_quiz_type);
}

const CreateToCollectionCallback = function(nodes: NoteRowType[], chirpai_quiz_type: ChirpAIQuizType) {
  SendTextToBackground(MessageID.ContentCreate, nodes, chirpai_quiz_type);
}

const SendTextToBackground = function(action_id: number, nodes: NoteRowType[], chirpai_quiz_type: ChirpAIQuizType) {  
  let messageStruct: ExtensionMessageStruct = { 
    id: action_id, sender: MessageSender.Tab, body: {nodes: nodes, chirpai_quiz_type: chirpai_quiz_type}, 
    host: window.location.host, source: window.location.href
  };

  Browser.runtime.sendMessage(messageStruct);

  let text = nodes.find(x=>x.type == 'paragraph')?.children[0].text;
  if (text != null)
    navigator.clipboard.writeText(text);

  window.getSelection().removeAllRanges();
}

const GetChirpAIQuizData = function() {
  let quiz_type : ChirpAIQuizType = {
    standard: GetDOMElementValue(ChirpAIQuizDataKey.standard, ''),
    grade: GetDOMElementValue(ChirpAIQuizDataKey.grade, ''),
    bloom_level: GetDOMElementValue(ChirpAIQuizDataKey.bloom_level, ''),
    image_url: GetDOMElementValue(ChirpAIQuizDataKey.image_url, ''),
    subject: GetDOMElementValue(ChirpAIQuizDataKey.subject, ''),
    topics: [],
    country: GetDOMElementValue(ChirpAIQuizDataKey.country, ''),
    key_stage: GetDOMElementValue(ChirpAIQuizDataKey.key_stage, '')
  }

  if (_cache_quiz_id != null)
    quiz_type.quiz_id = _cache_quiz_id;

  let raw_topics = GetDOMElementValue(ChirpAIQuizDataKey.topics, '');
  quiz_type.topics = raw_topics.split(",");
  
  if (quiz_type.topics[0] == '') quiz_type.topics = [];

  return quiz_type;
}

const GetDOMElementValue = function(key: string, default_value?: string): string {
  let standards = document.querySelectorAll<HTMLBaseElement>(`[${key}]`);
  let filter_key = key.replace('data-', '');

  try {
    let slash_index = filter_key.indexOf('-');
    if (slash_index >= 0)
      filter_key = filter_key.replace(`-${filter_key[slash_index+1]}`, filter_key[slash_index+1].toUpperCase());
    

    let value = standards[0].dataset[filter_key];
    console.log(standards[0].dataset);
    if (value == null || value == undefined)
      return default_value;

    return value;
  } catch {
    console.error(`GetDOMElementValue Key ${filter_key} do not exist`);
  }

  if (default_value != null) return default_value

  return null;
} 

const ReplaceStringAt = function(source: string, index: number, replacement: string) {
  return source.substring(0, index) + replacement + source.substring(index + replacement.length);
}